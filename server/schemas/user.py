import re
from datetime import datetime
from typing import Annotated

from email_validator import EmailNotValidError, validate_email
from pydantic import BaseModel, BeforeValidator, ConfigDict, field_validator

from models.user import UserRole
from utils.security import password_issues


DEV_EMAIL_SUFFIXES = (".local", ".localhost", ".test", ".example", ".invalid")
_BASIC_EMAIL_SHAPE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _validate_email(value: str) -> str:
    """Strict email validation, plus reserved dev-only domains (demo.local).

    email-validator rejects special-use domains outright, so addresses under
    dev suffixes get a basic shape check instead. Those domains can never
    receive real mail, so this only affects local development logins.
    """
    if not isinstance(value, str):
        raise ValueError("Invalid email address")
    value = value.strip()
    try:
        return validate_email(value, check_deliverability=False).normalized
    except EmailNotValidError:
        lowered = value.lower()
        if lowered.endswith(DEV_EMAIL_SUFFIXES) and _BASIC_EMAIL_SHAPE.match(value):
            local, _, domain = value.rpartition("@")
            return f"{local}@{domain.lower()}"
        raise ValueError("Invalid email address")


AppEmail = Annotated[str, BeforeValidator(_validate_email)]


def _check_strong_password(value: str) -> str:
    issues = password_issues(value)
    if issues:
        raise ValueError("; ".join(issues))
    return value


class SignupRequest(BaseModel):
    name: str
    email: AppEmail
    password: str

    @field_validator("password")
    @classmethod
    def _password_policy(cls, value: str) -> str:
        return _check_strong_password(value)


class LoginRequest(BaseModel):
    email: AppEmail
    password: str


class StaffCreateRequest(BaseModel):
    name: str
    email: AppEmail
    password: str

    @field_validator("password")
    @classmethod
    def _password_policy(cls, value: str) -> str:
        return _check_strong_password(value)


class ForgotPasswordRequest(BaseModel):
    email: AppEmail


class ResetPasswordRequest(BaseModel):
    token: str
    password: str

    @field_validator("password")
    @classmethod
    def _password_policy(cls, value: str) -> str:
        return _check_strong_password(value)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: AppEmail
    role: UserRole
    created_at: datetime
    updated_at: datetime


class UserEnvelope(BaseModel):
    user: UserResponse


class StaffListEnvelope(BaseModel):
    staff: list[UserResponse]


class MessageEnvelope(BaseModel):
    message: str
