import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated

from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.orm import Session

from config.db import get_db
from models import PasswordReset, User, UserRole
from schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    StaffCreate,
    UserCreate,
    UserResponse,
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])
admin_router = APIRouter(prefix="/api/admin", tags=["administration"])

PASSWORD_HASHER = PasswordHasher()
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
TOKEN_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _is_expired(value: datetime) -> bool:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value < datetime.now(timezone.utc)


def _user_payload(user: User) -> dict:
    return UserResponse.model_validate(user).model_dump(mode="json")


def _access_token(user: User) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_MINUTES)
    return jwt.encode({"sub": str(user.id), "role": user.role.value, "exp": expires}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _set_auth_cookie(response: Response, user: User) -> None:
    response.set_cookie(
        "token",
        _access_token(user),
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        max_age=TOKEN_MINUTES * 60,
    )


def current_user(
    token: Annotated[str | None, Cookie()] = None,
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload.get("sub", ""))
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists")
    return user


def require_admin(user: User = Depends(current_user)) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


@router.post("/signup", response_model=dict, status_code=status.HTTP_201_CREATED)
def signup(data: UserCreate, response: Response, db: Session = Depends(get_db)):
    email = data.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="Email is already registered")
    user = User(name=data.name.strip(), email=email, password_hash=PASSWORD_HASHER.hash(data.password), role=UserRole.CUSTOMER)
    db.add(user)
    db.commit()
    db.refresh(user)
    _set_auth_cookie(response, user)
    return {"user": _user_payload(user)}


@router.post("/login", response_model=dict)
def login(data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    try:
        PASSWORD_HASHER.verify(user.password_hash, data.password)
    except (VerifyMismatchError, VerificationError):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    _set_auth_cookie(response, user)
    return {"user": _user_payload(user)}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("token")
    return {"message": "Logged out"}


@router.get("/me", response_model=dict)
def me(user: User = Depends(current_user)):
    return {"user": _user_payload(user)}


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if user:
        raw_token = secrets.token_urlsafe(32)
        db.add(PasswordReset(
            user_id=user.id,
            token_hash=_hash_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        ))
        db.commit()
        print(f"Password reset link for {user.email}: /reset-password?token={raw_token}")
    return {"message": "If that email exists, a reset link was sent"}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    reset = db.scalar(select(PasswordReset).where(
        PasswordReset.token_hash == _hash_token(data.token),
        PasswordReset.used_at.is_(None),
    ))
    if not reset or _is_expired(reset.expires_at):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    user = db.get(User, reset.user_id)
    user.password_hash = PASSWORD_HASHER.hash(data.password)
    reset.used_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Password reset successfully"}


@admin_router.get("/staff", response_model=dict)
def list_staff(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    staff = db.scalars(select(User).where(User.role == UserRole.STAFF).order_by(User.created_at.desc())).all()
    return {"staff": [_user_payload(user) for user in staff]}


@admin_router.post("/staff", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_staff(data: StaffCreate, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    email = data.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="Email is already registered")
    user = User(name=data.name.strip(), email=email, password_hash=PASSWORD_HASHER.hash(data.password), role=UserRole.STAFF)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user": _user_payload(user)}


@admin_router.delete("/staff/{user_id}")
def delete_staff(user_id: int, _: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user or user.role != UserRole.STAFF:
        raise HTTPException(status_code=404, detail="Staff member not found")
    db.delete(user)
    db.commit()
    return {"message": "Staff member removed"}
