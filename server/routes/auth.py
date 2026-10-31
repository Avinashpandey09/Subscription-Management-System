from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from config.db import get_db
from deps import SESSION_COOKIE, get_current_user
from models.password_reset import PasswordReset
from models.user import User, UserRole
from schemas.user import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageEnvelope,
    ResetPasswordRequest,
    SignupRequest,
    UserEnvelope,
)
from utils.mailer import send_password_reset
from utils.security import (
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    generate_reset_token,
    hash_password,
    hash_reset_token,
    normalize_email,
    verify_password,
)
from utils.security import RESET_TOKEN_EXPIRE_MINUTES

import os

router = APIRouter(prefix="/api/auth", tags=["auth"])

COOKIE_MAX_AGE = JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"


def _set_session(response: Response, user_id: int) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        create_access_token(user_id),
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        path="/",
    )


def _get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == normalize_email(email)))


@router.post("/signup", response_model=UserEnvelope, status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest, response: Response, db: Session = Depends(get_db)):
    if _get_by_email(db, body.email):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
    # Role is always forced to customer: the request carries no role field,
    # so privilege escalation via crafted payloads is impossible.
    user = User(
        name=body.name.strip(),
        email=normalize_email(body.email),
        password_hash=hash_password(body.password),
        role=UserRole.CUSTOMER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    _set_session(response, user.id)
    return {"user": user}


@router.post("/login", response_model=UserEnvelope)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = _get_by_email(db, body.email)
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    _set_session(response, user.id)
    return {"user": user}


@router.post("/logout", response_model=MessageEnvelope)
def logout(response: Response):
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"message": "Logged out"}


@router.get("/me", response_model=UserEnvelope)
def me(user: User = Depends(get_current_user)):
    return {"user": user}


@router.post("/forgot-password", response_model=MessageEnvelope)
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # Always the same response: never reveal whether the email exists.
    user = _get_by_email(db, body.email)
    if user is not None:
        raw, digest = generate_reset_token()
        db.add(
            PasswordReset(
                user_id=user.id,
                token_hash=digest,
                expires_at=datetime.now(timezone.utc)
                + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES),
            )
        )
        db.commit()
        send_password_reset(user.email, raw)
    return {"message": "If that email exists, a reset link was sent"}


@router.post("/reset-password", response_model=MessageEnvelope)
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    record = db.scalar(
        select(PasswordReset).where(
            PasswordReset.token_hash == hash_reset_token(body.token.strip())
        )
    )
    now = datetime.now(timezone.utc)
    if record is None or record.used_at is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset token")
    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset token")

    user = db.get(User, record.user_id)
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired reset token")
    user.password_hash = hash_password(body.password)
    record.used_at = now
    db.commit()
    return {"message": "Password reset successful"}
