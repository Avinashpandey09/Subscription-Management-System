"""Module 1 end-to-end: auth, RBAC and staff management.

Route functions are called directly against a real (sqlite) database, and
every result is validated through the route's declared response model, so
serialization problems surface here instead of at runtime.
"""

import json
from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException, Response
from fastapi.routing import APIRoute
from pydantic import ValidationError

import main
from deps import get_current_user, require_admin
from main import http_error_response, validation_error_response
from models.password_reset import PasswordReset
from models.user import User, UserRole
from routes import admin, auth
from schemas.user import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageEnvelope,
    ResetPasswordRequest,
    SignupRequest,
    StaffCreateRequest,
    StaffListEnvelope,
    UserEnvelope,
)
from utils.security import generate_reset_token, hash_password


def _make_user(db, role=UserRole.CUSTOMER, email="user@demo.local"):
    user = User(
        name=role.value.title(),
        email=email,
        password_hash=hash_password("Demo@1234"),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _session_token(response: Response):
    cookie = response.headers.get("set-cookie", "")
    assert "token=" in cookie and "HttpOnly" in cookie
    return cookie.split("token=")[1].split(";")[0]


def _iter_routes(routes):
    for route in routes:
        if isinstance(route, APIRoute):
            yield route
        else:
            nested = getattr(route, "routes", None)
            if nested is None:
                original = getattr(route, "original_router", None)
                nested = getattr(original, "routes", []) if original else []
            yield from _iter_routes(nested)


def test_routes_are_registered():
    paths = {
        (route.path, tuple(sorted(route.methods)))
        for route in _iter_routes(main.app.routes)
    }
    assert ("/api/auth/signup", ("POST",)) in paths
    assert ("/api/auth/login", ("POST",)) in paths
    assert ("/api/auth/logout", ("POST",)) in paths
    assert ("/api/auth/me", ("GET",)) in paths
    assert ("/api/auth/forgot-password", ("POST",)) in paths
    assert ("/api/auth/reset-password", ("POST",)) in paths
    assert ("/api/admin/staff", ("GET",)) in paths
    assert ("/api/admin/staff", ("POST",)) in paths
    assert ("/api/admin/staff/{user_id}", ("DELETE",)) in paths


def test_signup_creates_customer_and_logs_in(db):
    response = Response()
    result = UserEnvelope.model_validate(
        auth.signup(
            SignupRequest(name="New User", email="new@demo.local", password="Demo@1234"),
            response,
            db,
        )
    )
    assert result.user.email == "new@demo.local"
    assert result.user.role == UserRole.CUSTOMER
    assert isinstance(result.user.id, int)
    assert result.user.created_at is not None

    token = _session_token(response)
    me = UserEnvelope.model_validate({"user": get_current_user(token, db)})
    assert me.user.email == "new@demo.local"


def test_signup_forces_customer_role(db):
    result = UserEnvelope.model_validate(
        auth.signup(
            SignupRequest(
                name="Sneaky", email="sneaky@demo.local", password="Demo@1234"
            ),
            Response(),
            db,
        )
    )
    assert result.user.role == UserRole.CUSTOMER


def test_signup_rejects_duplicate_and_weak_password(db):
    auth.signup(
        SignupRequest(name="A", email="dup@demo.local", password="Demo@1234"),
        Response(),
        db,
    )
    with pytest.raises(HTTPException) as duplicate:
        auth.signup(
            SignupRequest(name="B", email="dup@demo.local", password="Demo@1234"),
            Response(),
            db,
        )
    assert duplicate.value.status_code == 400
    assert duplicate.value.detail == "Email already registered"

    with pytest.raises(ValidationError):
        SignupRequest(name="C", email="weak@demo.local", password="short")


def test_login_logout_and_me(db):
    _make_user(db, email="login@demo.local")

    with pytest.raises(HTTPException) as bad:
        auth.login(
            LoginRequest(email="login@demo.local", password="Wrong@1234"),
            Response(),
            db,
        )
    assert bad.value.status_code == 401

    with pytest.raises(HTTPException) as anonymous:
        get_current_user(None, db)
    assert anonymous.value.status_code == 401
    with pytest.raises(HTTPException) as forged:
        get_current_user("bogus-token", db)
    assert forged.value.status_code == 401

    response = Response()
    UserEnvelope.model_validate(
        auth.login(
            LoginRequest(email="login@demo.local", password="Demo@1234"),
            response,
            db,
        )
    )
    assert response.headers.get("set-cookie")

    logout_response = Response()
    result = MessageEnvelope.model_validate(auth.logout(logout_response))
    assert result.message == "Logged out"
    assert "token=" in logout_response.headers.get("set-cookie", "")


def test_forgot_password_always_succeeds(db):
    _make_user(db, email="known@demo.local")
    for email in ("known@demo.local", "unknown@demo.local"):
        result = MessageEnvelope.model_validate(
            auth.forgot_password(ForgotPasswordRequest(email=email), db)
        )
        assert "reset link was sent" in result.message


def test_reset_password_flow(db):
    user = _make_user(db, email="reset@demo.local")
    raw, digest = generate_reset_token()
    db.add(
        PasswordReset(
            user_id=user.id,
            token_hash=digest,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=60),
        )
    )
    db.commit()

    with pytest.raises(HTTPException) as bad:
        auth.reset_password(ResetPasswordRequest(token="bogus", password="Newp@1234"), db)
    assert bad.value.status_code == 400

    result = MessageEnvelope.model_validate(
        auth.reset_password(ResetPasswordRequest(token=raw, password="Newp@1234"), db)
    )
    assert "successful" in result.message

    with pytest.raises(HTTPException) as reuse:
        auth.reset_password(ResetPasswordRequest(token=raw, password="Again@1234"), db)
    assert reuse.value.status_code == 400

    UserEnvelope.model_validate(
        auth.login(
            LoginRequest(email="reset@demo.local", password="Newp@1234"),
            Response(),
            db,
        )
    )


def test_reset_token_expiry_is_enforced(db):
    user = _make_user(db, email="expired@demo.local")
    raw, digest = generate_reset_token()
    db.add(
        PasswordReset(
            user_id=user.id,
            token_hash=digest,
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
        )
    )
    db.commit()

    with pytest.raises(HTTPException) as expired:
        auth.reset_password(ResetPasswordRequest(token=raw, password="Newp@1234"), db)
    assert expired.value.status_code == 400


def test_admin_staff_crud_and_guards(db):
    administrator = _make_user(db, role=UserRole.ADMIN, email="admin@demo.local")
    customer = _make_user(db, role=UserRole.CUSTOMER, email="cust@demo.local")

    with pytest.raises(HTTPException) as forbidden:
        require_admin(customer)
    assert forbidden.value.status_code == 403
    assert require_admin(administrator).id == administrator.id

    listing = StaffListEnvelope.model_validate(admin.list_staff(db, administrator))
    assert [s.email for s in listing.staff] == ["admin@demo.local"]

    created = UserEnvelope.model_validate(
        admin.create_staff(
            StaffCreateRequest(
                name="Helper", email="helper@demo.local", password="Demo@1234"
            ),
            db,
            administrator,
        )
    )
    assert created.user.role == UserRole.STAFF

    with pytest.raises(HTTPException) as duplicate:
        admin.create_staff(
            StaffCreateRequest(
                name="Dup", email="helper@demo.local", password="Demo@1234"
            ),
            db,
            administrator,
        )
    assert duplicate.value.status_code == 400

    assert len(StaffListEnvelope.model_validate(admin.list_staff(db, administrator)).staff) == 2

    with pytest.raises(HTTPException) as own:
        admin.delete_staff(administrator.id, db, administrator)
    assert own.value.status_code == 400

    with pytest.raises(HTTPException) as missing:
        admin.delete_staff(999999, db, administrator)
    assert missing.value.status_code == 404

    with pytest.raises(HTTPException) as not_staff:
        admin.delete_staff(customer.id, db, administrator)
    assert not_staff.value.status_code == 404

    removed = MessageEnvelope.model_validate(
        admin.delete_staff(created.user.id, db, administrator)
    )
    assert "removed" in removed.message
    assert len(StaffListEnvelope.model_validate(admin.list_staff(db, administrator)).staff) == 1


def test_email_validation():
    assert (
        SignupRequest(name="A", email="user@demo.local", password="Demo@1234").email
        == "user@demo.local"
    )
    assert (
        SignupRequest(name="A", email="  USER@Example.COM ", password="Demo@1234").email
        == "USER@example.com"
    )
    with pytest.raises(ValidationError):
        SignupRequest(name="A", email="not-an-email", password="Demo@1234")
    with pytest.raises(ValidationError):
        SignupRequest(name="A", email="user@demo.local@", password="Demo@1234")


def test_error_envelopes_match_frontend_contract():
    response = http_error_response(400, "Email already registered")
    assert response.status_code == 400
    assert json.loads(response.body) == {"message": "Email already registered"}

    try:
        SignupRequest(name="C", email="weak@demo.local", password="short")
        raise AssertionError("expected ValidationError")
    except ValidationError as exc:
        validation = validation_error_response(exc.errors())
    assert validation.status_code == 422
    body = json.loads(validation.body)
    assert body["message"] == "Validation failed"
    assert body["issues"]
    assert all("message" in issue for issue in body["issues"])
