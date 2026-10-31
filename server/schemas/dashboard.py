from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field


class DashboardFilters(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    status: str | None = None
    customer_id: int | None = Field(default=None, gt=0)
    payment_method: str | None = None
    product_id: int | None = Field(default=None, gt=0)


class SummaryResponse(BaseModel):
    active_subscriptions: int
    total_revenue: float
    payments_received: float
    outstanding_amount: float
    overdue_invoices_count: int
    overdue_amount: float
    total_customers: int
    total_subscriptions: int


class SubscriptionStatsResponse(BaseModel):
    total_subscriptions: int
    active_subscriptions: int
    draft_subscriptions: int
    confirmed_subscriptions: int
    paused_subscriptions: int
    closed_subscriptions: int
    status_distribution: dict[str, int]


class RevenueResponse(BaseModel):
    total_revenue: float
    monthly_revenue: list[dict]
    quarterly_revenue: list[dict]
    yearly_revenue: list[dict]
    by_date: list[dict]
    by_month: list[dict]
    by_product: list[dict]


class PaymentReportResponse(BaseModel):
    total_payments_received: float
    successful_payments: int
    pending_payments: int
    failed_payments: int
    payment_count: int
    payment_method_distribution: list[dict]
    by_date: list[dict]


class OutstandingResponse(BaseModel):
    total_outstanding_amount: float
    unpaid_invoice_count: int
    partially_paid_invoice_count: int
    customer_balances: list[dict]


class OverdueInvoiceResponse(BaseModel):
    id: int
    number: str
    customer: dict
    due_date: date
    days_overdue: int
    remaining_balance: float


class OverdueResponse(BaseModel):
    count: int
    total_amount: float
    items: list[OverdueInvoiceResponse]
    page: int
    page_size: int
    total_pages: int
