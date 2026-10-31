from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

engine_options = {}
if DATABASE_URL.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_options)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


def normalize_user_role_enum():
    if engine.dialect.name != "postgresql":
        return

    with engine.begin() as connection:
        labels = connection.execute(
            text( 
                """
                SELECT enumlabel
                FROM pg_enum
                JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
                WHERE pg_type.typname = 'user_role'
                """
            )
        ).scalars().all()

        for label in ("ADMIN", "STAFF", "CUSTOMER"):
            if label in labels:
                connection.execute(
                    text(f"ALTER TYPE user_role RENAME VALUE '{label}' TO '{label.lower()}'")
                )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()