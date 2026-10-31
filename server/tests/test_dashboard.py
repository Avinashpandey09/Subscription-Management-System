import hashlib
import os
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path
from tempfile import gettempdir

DB_PATH = Path(gettempdir()) / "subscription_dashboard_tests.db"
if DB_PATH.exists():
    DB_PATH.unlink()
os.environ["DATABASE_URL"] = f"sqlite:///{DB_PATH.as_posix()}"
os.environ["JWT_SECRET_KEY"] = "dashboard-test-secret"

from fastapi.testclient import TestClient

from config.db import Base, SessionLocal, engine
from main import app
from models import (
    Invoice, InvoiceStatus, Payment, PaymentStatus, Plan, Product,
    Subscription, SubscriptionStatus, User, UserRole,
)
from router.auth import PASSWORD_HASHER


Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    admin = User(name="Admin", email="admin@test.example.com", password_hash=PASSWORD_HASHER.hash("StrongPass1!"), role=UserRole.ADMIN)
    customer = User(name="Customer", email="customer@test.example.com", password_hash=PASSWORD_HASHER.hash("StrongPass1!"), role=UserRole.CUSTOMER)
    other = User(name="Other", email="other@test.example.com", password_hash=PASSWORD_HASHER.hash("StrongPass1!"), role=UserRole.CUSTOMER)
    db.add_all([admin, customer, other])
    db.flush()
    other_id = other.id
    product = Product(name="Analytics")
    db.add(product)
    db.flush()
    plan = Plan(product_id=product.id, name="Monthly", price=Decimal("100.00"))
    db.add(plan)
    db.flush()
    db.add_all([
        Subscription(customer_id=customer.id, plan_id=plan.id, status=SubscriptionStatus.ACTIVE),
        Subscription(customer_id=customer.id, plan_id=plan.id, status=SubscriptionStatus.DRAFT),
        Subscription(customer_id=other.id, plan_id=plan.id, status=SubscriptionStatus.CLOSED),
    ])
    db.flush()
    invoice = Invoice(number="INV-1", customer_id=customer.id, total=Decimal("100.00"), due_date=date.today() - timedelta(days=5), status=InvoiceStatus.CONFIRMED)
    paid_invoice = Invoice(number="INV-2", customer_id=customer.id, total=Decimal("50.00"), due_date=date.today() + timedelta(days=5), status=InvoiceStatus.CONFIRMED)
    cancelled = Invoice(number="INV-3", customer_id=customer.id, total=Decimal("25.00"), due_date=date.today() - timedelta(days=5), status=InvoiceStatus.CANCELLED)
    other_invoice = Invoice(number="INV-4", customer_id=other.id, total=Decimal("70.00"), due_date=date.today() - timedelta(days=5), status=InvoiceStatus.CONFIRMED)
    db.add_all([invoice, paid_invoice, cancelled, other_invoice])
    db.flush()
    db.add_all([
        Payment(invoice_id=invoice.id, customer_id=customer.id, amount=Decimal("40.00"), status=PaymentStatus.SUCCESSFUL, method="card", paid_at=datetime.now(timezone.utc)),
        Payment(invoice_id=paid_invoice.id, customer_id=customer.id, amount=Decimal("50.00"), status=PaymentStatus.SUCCESSFUL, method="upi", paid_at=datetime.now(timezone.utc)),
        Payment(invoice_id=other_invoice.id, customer_id=other.id, amount=Decimal("70.00"), status=PaymentStatus.SUCCESSFUL, method="card", paid_at=datetime.now(timezone.utc)),
        Payment(invoice_id=invoice.id, customer_id=customer.id, amount=Decimal("10.00"), status=PaymentStatus.PENDING, method="card"),
    ])
    db.commit()


client = TestClient(app)
admin_login = client.post("/api/auth/login", json={"email": "admin@test.example.com", "password": "StrongPass1!"})
assert admin_login.status_code == 200
admin_cookie = admin_login.cookies
customer_client = TestClient(app)
customer_login = customer_client.post("/api/auth/login", json={"email": "customer@test.example.com", "password": "StrongPass1!"})
assert customer_login.status_code == 200


def get(path, client=client, **params):
    return client.get(path, params=params)


assert get("/api/v1/dashboard/summary", client=client).status_code == 200
assert get("/api/v1/dashboard/summary", client=customer_client).json()["total_customers"] == 1
assert get("/api/v1/dashboard/subscriptions", client=client).json()["total_subscriptions"] == 3
assert get("/api/v1/dashboard/subscriptions", client=client).json()["active_subscriptions"] == 1
assert get("/api/v1/dashboard/revenue", client=client).json()["total_revenue"] == 160.0
assert get("/api/v1/dashboard/payments", client=client).json()["successful_payments"] == 3
assert get("/api/v1/dashboard/payments", client=client, payment_method="upi").json()["payment_count"] == 1
assert get("/api/v1/dashboard/outstanding", client=client).json()["total_outstanding_amount"] == 60.0
assert get("/api/v1/dashboard/outstanding", client=customer_client).json()["total_outstanding_amount"] == 60.0
assert get("/api/v1/dashboard/overdue", client=client).json()["count"] == 1
assert get("/api/v1/dashboard/overdue", client=customer_client).json()["count"] == 1
assert get("/api/v1/dashboard/overdue", client=client, page=2, page_size=1).json()["page"] == 2
assert get("/api/v1/dashboard/summary", client=client, start_date="2027-01-02", end_date="2027-01-01").status_code == 422
assert get("/api/v1/dashboard/summary", client=customer_client, customer_id=other_id).json()["total_subscriptions"] == 2
assert get("/api/v1/dashboard/summary", client=TestClient(app)).status_code == 401
print("15 dashboard test cases passed")
