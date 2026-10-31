from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from config.db import get_db
from deps import require_admin
from models.password_reset import PasswordReset
from models.user import User, UserRole
from schemas.user import MessageEnvelope, StaffCreateRequest, StaffListEnvelope, UserEnvelope
from utils.security import hash_password, normalize_email

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/staff", response_model=StaffListEnvelope)
def list_staff(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    staff = db.scalars(
        select(User)
        .where(User.role.in_([UserRole.ADMIN, UserRole.STAFF]))
        .order_by(User.id)
    ).all()
    return {"staff": staff}


@router.post("/staff", response_model=UserEnvelope, status_code=status.HTTP_201_CREATED)
def create_staff(
    body: StaffCreateRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    email = normalize_email(body.email)
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email already registered")
    user = User(
        name=body.name.strip(),
        email=email,
        password_hash=hash_password(body.password),
        role=UserRole.STAFF,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"user": user}


@router.delete("/staff/{user_id}", response_model=MessageEnvelope)
def delete_staff(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if user is None or user.role == UserRole.CUSTOMER:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Staff member not found")
    if user.id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot remove your own account")
    if user.role == UserRole.ADMIN:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot remove an admin account")
    db.execute(delete(PasswordReset).where(PasswordReset.user_id == user.id))
    db.delete(user)
    db.commit()
    return {"message": "Staff member removed"}
