"""Pytest setup: sqlite database, configured BEFORE the app is imported.

The suite calls route functions directly against a real database instead of
going through HTTP, so it also runs where sockets are unavailable.
"""

import os
import tempfile

_db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_db_file.close()

os.environ["DATABASE_URL"] = f"sqlite:///{_db_file.name}"
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")

import pytest  # noqa: E402

from config.db import Base, SessionLocal, engine  # noqa: E402


@pytest.fixture()
def db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def pytest_sessionfinish(session, exitstatus):
    try:
        os.unlink(_db_file.name)
    except OSError:
        pass
