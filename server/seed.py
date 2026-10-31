"""Seed demo users. Run from server/:  python seed.py"""

from sqlalchemy import select

from config.db import Base, SessionLocal, engine, ensure_user_timestamps, normalize_user_role_enum
from models import password_reset  # noqa: F401 — register tables
from models.user import User, UserRole
from utils.security import hash_password, normalize_email

DEMOS = [
    ("Admin", "admin@demo.local", UserRole.ADMIN),
    ("Staff", "staff@demo.local", UserRole.STAFF),
    ("Customer", "customer@demo.local", UserRole.CUSTOMER),
]
PASSWORD = "Demo@1234"


def main() -> None:
    normalize_user_role_enum()
    Base.metadata.create_all(bind=engine)
    ensure_user_timestamps()

    db = SessionLocal()
    try:
        for name, email, role in DEMOS:
            email = normalize_email(email)
            if db.scalar(select(User).where(User.email == email)):
                print(f"exists: {email} ({role.value})")
                continue
            db.add(
                User(
                    name=name,
                    email=email,
                    password_hash=hash_password(PASSWORD),
                    role=role,
                )
            )
            print(f"created: {email} ({role.value})")
        db.commit()
    finally:
        db.close()

    print(f"\nLog in with password: {PASSWORD}")


if __name__ == "__main__":
    main()
