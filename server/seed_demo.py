from sqlalchemy import select

from argon2 import PasswordHasher

from config.db import Base, SessionLocal, engine
from models import User, UserRole


DEMO_PASSWORD = "Demo@1234"
DEMO_USERS = (
    ("Demo Admin", "admin@demo.example.com", UserRole.ADMIN),
    ("Demo Staff", "staff@demo.example.com", UserRole.STAFF),
    ("Demo Customer", "customer@demo.example.com", UserRole.CUSTOMER),
)


def seed_demo_users() -> None:
    Base.metadata.create_all(bind=engine)
    password_hash = PasswordHasher().hash(DEMO_PASSWORD)

    with SessionLocal() as db:
        for name, email, role in DEMO_USERS:
            user = db.scalar(select(User).where(User.email == email))
            if user:
                user.name = name
                user.role = role
                continue
            db.add(User(name=name, email=email, password_hash=password_hash, role=role))
        db.commit()

    print("Demo users are ready:")
    for _, email, role in DEMO_USERS:
        print(f"- {role.value}: {email} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    seed_demo_users()
