from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from config.db import get_db
from deps import require_admin
from models.product import Product, ProductVariant
from models.user import User
from schemas.products import (
    ProductEnvelope,
    ProductListEnvelope,
    ProductStatusRequest,
    ProductUpsertRequest,
)
from schemas.user import MessageEnvelope

router = APIRouter(prefix="/api/catalog/products", tags=["products"])


def _product_query():
    return select(Product).options(selectinload(Product.variants))


def _replace_product_fields(product: Product, body: ProductUpsertRequest) -> None:
    product.name = body.name
    product.type = body.type
    product.sales_price = body.sales_price
    product.cost_price = body.cost_price
    product.notes = body.notes
    product.is_active = body.is_active
    product.variants = [
        ProductVariant(
            attribute_name=variant.attribute_name,
            attribute_value=variant.attribute_value,
            extra_price=variant.extra_price,
        )
        for variant in body.variants
    ]


def _product_payload(product: Product) -> dict:
    return {
        "id": product.id,
        "name": product.name,
        "type": product.type,
        "salesPrice": product.sales_price,
        "costPrice": product.cost_price,
        "notes": product.notes,
        "isActive": product.is_active,
        "createdAt": product.created_at,
        "updatedAt": product.updated_at,
        "variants": [
            {
                "id": variant.id,
                "attributeName": variant.attribute_name,
                "attributeValue": variant.attribute_value,
                "extraPrice": variant.extra_price,
                "finalPrice": product.sales_price + variant.extra_price,
            }
            for variant in product.variants
        ],
    }


@router.get("", response_model=ProductListEnvelope)
def list_products(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, alias="pageSize", ge=1, le=100),
    is_active: bool | None = Query(default=None, alias="isActive"),
    db: Session = Depends(get_db),
):
    statement = _product_query()
    count_statement = select(func.count(Product.id))
    if is_active is not None:
        statement = statement.where(Product.is_active == is_active)
        count_statement = count_statement.where(Product.is_active == is_active)
    products = db.scalars(
        statement.order_by(Product.id).offset((page - 1) * page_size).limit(page_size)
    ).all()
    total = db.scalar(count_statement) or 0
    return {
        "products": [_product_payload(product) for product in products],
        "total": total,
        "page": page,
        "pageSize": page_size,
    }


@router.post(
    "",
    response_model=ProductEnvelope,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    body: ProductUpsertRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    product = Product()
    _replace_product_fields(product, body)
    db.add(product)
    db.commit()
    product = db.scalar(_product_query().where(Product.id == product.id))
    return {"product": _product_payload(product)}


@router.get("/{product_id}", response_model=ProductEnvelope)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.scalar(_product_query().where(Product.id == product_id))
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return {"product": _product_payload(product)}


@router.put("/{product_id}", response_model=ProductEnvelope)
def update_product(
    product_id: int,
    body: ProductUpsertRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    product = db.scalar(_product_query().where(Product.id == product_id))
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    _replace_product_fields(product, body)
    db.commit()
    return {"product": _product_payload(product)}


@router.patch("/{product_id}/status", response_model=ProductEnvelope)
def update_product_status(
    product_id: int,
    body: ProductStatusRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    product.is_active = body.is_active
    db.commit()
    product = db.scalar(_product_query().where(Product.id == product_id))
    return {"product": _product_payload(product)}


@router.delete("/{product_id}", response_model=MessageEnvelope)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    db.delete(product)
    db.commit()
    return {"message": "Product removed"}
