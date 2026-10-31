from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from config.db import get_db
from router.auth import current_user
from schemas.dashboard import (
    DashboardFilters,
    OutstandingResponse,
    OverdueResponse,
    PaymentReportResponse,
    RevenueResponse,
    SubscriptionStatsResponse,
    SummaryResponse,
)
from services.dashboard_service import (
    overdue,
    outstanding,
    payments,
    revenue,
    subscription_stats,
    summary,
)

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


def _filters(
    start_date: date | None,
    end_date: date | None,
    status: str | None,
    customer_id: int | None,
    payment_method: str | None,
    product_id: int | None,
) -> DashboardFilters:
    try:
        return DashboardFilters(
            start_date=start_date,
            end_date=end_date,
            status=status,
            customer_id=customer_id,
            payment_method=payment_method,
            product_id=product_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def filter_dependency(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    status: str | None = Query(None),
    customer_id: int | None = Query(None, gt=0),
    payment_method: str | None = Query(None),
    product_id: int | None = Query(None, gt=0),
) -> DashboardFilters:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(status_code=422, detail="start_date must be on or before end_date")
    return _filters(start_date, end_date, status, customer_id, payment_method, product_id)


@router.get("/summary", response_model=SummaryResponse)
def get_summary(filters: DashboardFilters = Depends(filter_dependency), user=Depends(current_user), db: Session = Depends(get_db)):
    return summary(db, user, filters)


@router.get("/subscriptions", response_model=SubscriptionStatsResponse)
def get_subscriptions(filters: DashboardFilters = Depends(filter_dependency), user=Depends(current_user), db: Session = Depends(get_db)):
    return subscription_stats(db, user, filters)


@router.get("/revenue", response_model=RevenueResponse)
def get_revenue(filters: DashboardFilters = Depends(filter_dependency), user=Depends(current_user), db: Session = Depends(get_db)):
    return revenue(db, user, filters)


@router.get("/payments", response_model=PaymentReportResponse)
def get_payments(filters: DashboardFilters = Depends(filter_dependency), user=Depends(current_user), db: Session = Depends(get_db)):
    return payments(db, user, filters)


@router.get("/outstanding", response_model=OutstandingResponse)
def get_outstanding(filters: DashboardFilters = Depends(filter_dependency), user=Depends(current_user), db: Session = Depends(get_db)):
    return outstanding(db, user, filters)


@router.get("/overdue", response_model=OverdueResponse)
def get_overdue(
    filters: DashboardFilters = Depends(filter_dependency),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    user=Depends(current_user),
    db: Session = Depends(get_db),
):
    return overdue(db, user, filters, page, page_size)
