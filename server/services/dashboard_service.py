from datetime import date
from decimal import Decimal
from math import ceil

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from models import (
    Invoice, InvoiceStatus, Payment, PaymentStatus, Plan, Product,
    Subscription, SubscriptionStatus, User, UserRole,
)


def _zero(value):
    return value if value is not None else Decimal("0.00")


def _money(value):
    return float(_zero(value))


def _date_filters(column, start_date, end_date):
    filters = []
    if start_date:
        filters.append(column >= start_date)
    if end_date:
        filters.append(column <= end_date)
    return filters


def _scope(filters, user):
    if user.role == UserRole.CUSTOMER:
        filters.append(Invoice.customer_id == user.id)
    elif filters.customer_id:
        filters.append(Invoice.customer_id == filters.customer_id)


def _validate_dates(start_date, end_date):
    if start_date and end_date and start_date > end_date:
        raise ValueError("start_date must be on or before end_date")


def summary(db: Session, user, filters):
    _validate_dates(filters.start_date, filters.end_date)
    customer_id = user.id if user.role == UserRole.CUSTOMER else filters.customer_id
    sub_filters = _date_filters(Subscription.created_at, filters.start_date, filters.end_date)
    inv_filters = _date_filters(Invoice.created_at, filters.start_date, filters.end_date)
    if customer_id:
        sub_filters.append(Subscription.customer_id == customer_id)
        inv_filters.append(Invoice.customer_id == customer_id)
    if filters.product_id:
        sub_filters.append(Subscription.plan_id.in_(select(Plan.id).where(Plan.product_id == filters.product_id)))
        inv_filters.append(Invoice.subscription_id.in_(select(Subscription.id).where(Subscription.plan_id.in_(select(Plan.id).where(Plan.product_id == filters.product_id)))))
    active = db.scalar(select(func.count()).select_from(Subscription).where(Subscription.status == SubscriptionStatus.ACTIVE, *sub_filters)) or 0
    total_subscriptions = db.scalar(select(func.count()).select_from(Subscription).where(*sub_filters)) or 0
    successful = [Payment.status == PaymentStatus.SUCCESSFUL, *_date_filters(Payment.paid_at, filters.start_date, filters.end_date)]
    if customer_id:
        successful.append(Payment.customer_id == customer_id)
    payments = _zero(db.scalar(select(func.sum(Payment.amount)).where(*successful)))
    invoice_rows = db.execute(select(Invoice.id, Invoice.total).where(Invoice.status != InvoiceStatus.CANCELLED, *inv_filters)).all()
    invoice_ids = [row.id for row in invoice_rows]
    allocated = _zero(db.scalar(select(func.sum(Payment.amount)).where(Payment.status == PaymentStatus.SUCCESSFUL, Payment.invoice_id.in_(invoice_ids)))) if invoice_ids else Decimal("0")
    overdue_filter = [Invoice.due_date < date.today(), Invoice.status != InvoiceStatus.CANCELLED, *inv_filters]
    overdue = db.execute(select(Invoice.id, Invoice.total).where(*overdue_filter)).all()
    overdue_ids = [row.id for row in overdue]
    overdue_paid = _zero(db.scalar(select(func.sum(Payment.amount)).where(Payment.status == PaymentStatus.SUCCESSFUL, Payment.invoice_id.in_(overdue_ids)))) if overdue_ids else Decimal("0")
    customer_filters = [User.role == UserRole.CUSTOMER]
    if customer_id:
        customer_filters.append(User.id == customer_id)
    customers = db.scalar(select(func.count()).select_from(User).where(*customer_filters)) or 0
    return {
        "active_subscriptions": active, "total_revenue": _money(payments),
        "payments_received": _money(payments), "outstanding_amount": _money(sum((row.total for row in invoice_rows), Decimal()) - allocated),
        "overdue_invoices_count": sum(1 for row in overdue if row.total > 0),
        "overdue_amount": _money(sum((row.total for row in overdue), Decimal()) - overdue_paid),
        "total_customers": customers, "total_subscriptions": total_subscriptions,
    }


def subscription_stats(db: Session, user, filters):
    _validate_dates(filters.start_date, filters.end_date)
    conditions = _date_filters(Subscription.created_at, filters.start_date, filters.end_date)
    if user.role == UserRole.CUSTOMER:
        conditions.append(Subscription.customer_id == user.id)
    elif filters.customer_id:
        conditions.append(Subscription.customer_id == filters.customer_id)
    if filters.product_id:
        conditions.append(Subscription.plan_id.in_(select(Plan.id).where(Plan.product_id == filters.product_id)))
    rows = db.execute(select(Subscription.status, func.count()).where(*conditions).group_by(Subscription.status)).all()
    distribution = {status.value: 0 for status in SubscriptionStatus}
    for status, count in rows:
        distribution[status.value] = count
    return {
        "total_subscriptions": sum(distribution.values()),
        "active_subscriptions": distribution["active"], "draft_subscriptions": distribution["draft"],
        "confirmed_subscriptions": distribution["confirmed"], "paused_subscriptions": distribution["paused"],
        "closed_subscriptions": distribution["closed"], "status_distribution": distribution,
    }


def payments(db: Session, user, filters):
    _validate_dates(filters.start_date, filters.end_date)
    conditions = _date_filters(Payment.paid_at, filters.start_date, filters.end_date)
    if user.role == UserRole.CUSTOMER:
        conditions.append(Payment.customer_id == user.id)
    elif filters.customer_id:
        conditions.append(Payment.customer_id == filters.customer_id)
    if filters.payment_method:
        conditions.append(Payment.method == filters.payment_method)
    rows = db.execute(select(Payment.status, func.count(), func.sum(Payment.amount)).where(*conditions).group_by(Payment.status)).all()
    counts = {status.value: {"count": 0, "amount": Decimal("0")} for status in PaymentStatus}
    for status, count, amount in rows:
        counts[status.value] = {"count": count, "amount": _zero(amount)}
    method_rows = db.execute(select(Payment.method, func.count()).where(*conditions).group_by(Payment.method)).all()
    payment_day = func.date(Payment.paid_at)
    date_rows = db.execute(select(payment_day, func.sum(Payment.amount)).where(Payment.status == PaymentStatus.SUCCESSFUL, *conditions).group_by(payment_day).order_by(payment_day)).all()
    return {
        "total_payments_received": _money(counts["successful"]["amount"]),
        "successful_payments": counts["successful"]["count"], "pending_payments": counts["pending"]["count"],
        "failed_payments": counts["failed"]["count"], "payment_count": sum(item["count"] for item in counts.values()),
        "payment_method_distribution": [{"method": method, "count": count} for method, count in method_rows],
        "by_date": [{"date": day, "amount": _money(amount)} for day, amount in date_rows],
    }


def revenue(db: Session, user, filters):
    _validate_dates(filters.start_date, filters.end_date)
    conditions = [Payment.status == PaymentStatus.SUCCESSFUL, *_date_filters(Payment.paid_at, filters.start_date, filters.end_date)]
    if user.role == UserRole.CUSTOMER:
        conditions.append(Payment.customer_id == user.id)
    elif filters.customer_id:
        conditions.append(Payment.customer_id == filters.customer_id)
    query = select(Payment.paid_at, Payment.amount, Product.id, Product.name).join(
        Invoice, Invoice.id == Payment.invoice_id
    ).join(
        Subscription, Subscription.id == Invoice.subscription_id, isouter=True
    ).join(
        Plan, Plan.id == Subscription.plan_id, isouter=True
    ).join(
        Product, Product.id == Plan.product_id, isouter=True
    ).where(*conditions)
    if filters.product_id:
        query = query.where(Product.id == filters.product_id)
    rows = db.execute(query).all()
    by_date = {}
    by_month = {}
    quarterly = {}
    yearly = {}
    products = {}
    for paid_at, amount, product_id, product_name in rows:
        if not paid_at:
            continue
        day = paid_at.date().isoformat()
        month = paid_at.strftime("%Y-%m")
        quarter = f"{paid_at.year}-Q{((paid_at.month - 1) // 3) + 1}"
        year = str(paid_at.year)
        amount = _zero(amount)
        by_date[day] = by_date.get(day, Decimal("0")) + amount
        by_month[month] = by_month.get(month, Decimal("0")) + amount
        quarterly[quarter] = quarterly.get(quarter, Decimal("0")) + amount
        yearly[year] = yearly.get(year, Decimal("0")) + amount
        if product_id:
            products.setdefault(product_id, {"product_id": product_id, "product_name": product_name, "revenue": Decimal("0")})
            products[product_id]["revenue"] += amount
    def series(values, key):
        return [{key: label, "amount": _money(amount)} for label, amount in sorted(values.items())]
    return {
        "total_revenue": _money(sum(by_date.values(), Decimal("0"))),
        "monthly_revenue": series(by_month, "month"),
        "quarterly_revenue": series(quarterly, "quarter"),
        "yearly_revenue": series(yearly, "year"),
        "by_date": series(by_date, "date"),
        "by_month": series(by_month, "month"),
        "by_product": [{**item, "revenue": _money(item["revenue"])} for item in products.values()],
    }


def outstanding(db: Session, user, filters):
    _validate_dates(filters.start_date, filters.end_date)
    conditions = [Invoice.status != InvoiceStatus.CANCELLED, *_date_filters(Invoice.created_at, filters.start_date, filters.end_date)]
    if user.role == UserRole.CUSTOMER:
        conditions.append(Invoice.customer_id == user.id)
    elif filters.customer_id:
        conditions.append(Invoice.customer_id == filters.customer_id)
    invoices = db.execute(select(Invoice, User).join(User, User.id == Invoice.customer_id).where(*conditions)).all()
    balances = []
    for invoice, customer in invoices:
        paid = _zero(db.scalar(select(func.sum(Payment.amount)).where(Payment.invoice_id == invoice.id, Payment.status == PaymentStatus.SUCCESSFUL)))
        remaining = max(Decimal("0"), invoice.total - paid)
        if remaining:
            balances.append((invoice, customer, remaining))
    customer_balances = {}
    for invoice, customer, remaining in balances:
        entry = customer_balances.setdefault(customer.id, {"customer_id": customer.id, "customer_name": customer.name, "amount": Decimal("0")})
        entry["amount"] += remaining
    return {
        "total_outstanding_amount": _money(sum((item[2] for item in balances), Decimal("0"))),
        "unpaid_invoice_count": len(balances),
        "partially_paid_invoice_count": sum(1 for invoice, _, remaining in balances if remaining < invoice.total),
        "customer_balances": [{**item, "amount": _money(item["amount"])} for item in customer_balances.values()],
    }


def overdue(db: Session, user, filters, page, page_size):
    _validate_dates(filters.start_date, filters.end_date)
    conditions = [Invoice.due_date < date.today(), Invoice.status != InvoiceStatus.CANCELLED, *_date_filters(Invoice.created_at, filters.start_date, filters.end_date)]
    if user.role == UserRole.CUSTOMER:
        conditions.append(Invoice.customer_id == user.id)
    elif filters.customer_id:
        conditions.append(Invoice.customer_id == filters.customer_id)
    rows = db.execute(select(Invoice, User).join(User, User.id == Invoice.customer_id).where(*conditions).order_by(Invoice.due_date)).all()
    items = []
    for invoice, customer in rows:
        paid = _zero(db.scalar(select(func.sum(Payment.amount)).where(Payment.invoice_id == invoice.id, Payment.status == PaymentStatus.SUCCESSFUL)))
        remaining = invoice.total - paid
        if remaining > 0:
            items.append({"id": invoice.id, "number": invoice.number, "customer": {"id": customer.id, "name": customer.name, "email": customer.email}, "due_date": invoice.due_date, "days_overdue": (date.today() - invoice.due_date).days, "remaining_balance": _money(remaining)})
    offset = (page - 1) * page_size
    return {"count": len(items), "total_amount": _money(sum((Decimal(str(item["remaining_balance"])) for item in items), Decimal("0"))), "items": items[offset:offset + page_size], "page": page, "page_size": page_size, "total_pages": ceil(len(items) / page_size) if items else 0}
