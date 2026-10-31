"""Password hashing, JWT sessions and reset tokens.

bcrypt is used directly: passlib 1.7.x is unmaintained and breaks with
bcrypt >= 4.1, so it is intentionally not a dependency.
"""

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from jose import JWTError, jwt

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-only-secret-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

RESET_TOKEN_EXPIRE_MINUTES = 60
BCRYPT_MAX_BYTES = 72

if JWT_SECRET_KEY == "dev-only-secret-change-me":
    print("WARNING: JWT_SECRET_KEY is not set, using an insecure dev default.")


def password_issues(password: str) -> list[str]:
    """Return human-readable policy violations, [] when the password is ok."""
    issues: list[str] = []
    if len(password) < 8:
        issues.append("Password must be at least 8 characters long")
    if len(password.encode("utf-8")) > BCRYPT_MAX_BYTES:
        issues.append("Password must be at most 72 bytes long")
    if not any(c.isupper() for c in password):
        issues.append("Password must contain an uppercase letter")
    if not any(c.islower() for c in password):
        issues.append("Password must contain a lowercase letter")
    if not any(not c.isalnum() for c in password):
        issues.append("Password must contain a special character")
    return issues


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: int) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": expires}, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        return None


def generate_reset_token() -> tuple[str, str]:
    """Return (raw_token, sha256_hex) — only the hash is stored."""
    raw = secrets.token_urlsafe(32)
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return raw, digest


def hash_reset_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def normalize_email(email: str) -> str:
    return email.strip().lower()
