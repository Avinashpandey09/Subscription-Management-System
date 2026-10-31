from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
 

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
 
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()



def ensure_user_timestamps():
    """Add timestamp columns to a pre-existing users table (dev-friendly).

    Fresh databases get them via create_all; this only patches tables that
    were created before the columns existed. Safe to run on every boot.
    """
    if engine.dialect.name != "postgresql":
        return

    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()")
        )
        connection.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()")
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()