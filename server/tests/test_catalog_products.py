import pytest
from fastapi import HTTPException
from fastapi.routing import APIRoute
from pydantic import ValidationError
from sqlalchemy import select

from deps import require_admin
from models.product import Product, ProductVariant
from models.user import User, UserRole
from routes import catalog
from schemas.products import (
    ProductEnvelope,
    ProductStatusRequest,
    ProductUpsertRequest,
)


def _admin(db):
    user = User(
        name="Admin",
        email="admin@products.test",
        password_hash="not-used",
        role=UserRole.ADMIN,
    )
    db.add(user)
    db.commit()
    return user


def _body(**overrides):
    data = {
        "name": "Subscription app",
        "type": "Service",
        "salesPrice": 12500,
        "costPrice": 5000,
        "notes": "Annual plan",
        "isActive": True,
        "variants": [
            {
                "attributeName": "Brand",
                "attributeValue": "Odoo",
                "extraPrice": 56000,
            }
        ],
    }
    data.update(overrides)
    return ProductUpsertRequest.model_validate(data)


def test_product_routes_require_admin_for_writes():
    protected_methods = {"POST", "PUT", "PATCH", "DELETE"}
    for route in catalog.router.routes:
        if isinstance(route, APIRoute) and route.methods & protected_methods:
            assert any(dependency.call is require_admin for dependency in route.dependant.dependencies)


def test_product_create_and_single_product_include_calculated_variant_price(db):
    admin = _admin(db)
    created = catalog.create_product(_body(), db, admin)["product"]
    response = ProductEnvelope.model_validate({"product": created})

    assert response.product.name == "Subscription app"
    assert response.product.sales_price == 12500
    assert response.product.is_active is True
    assert response.product.created_at is not None
    assert response.product.variants[0].attribute_name == "Brand"
    assert response.product.variants[0].extra_price == 56000
    assert response.product.variants[0].final_price == 68500

    fetched = catalog.get_product(response.product.id, db)
    assert ProductEnvelope.model_validate(fetched).product.id == response.product.id


def test_product_list_supports_pagination_and_active_filter(db):
    admin = _admin(db)
    catalog.create_product(_body(name="Active one"), db, admin)
    catalog.create_product(_body(name="Active two", variants=[]), db, admin)
    inactive = catalog.create_product(
        _body(name="Inactive", isActive=False, variants=[]), db, admin
    )["product"]

    first_page = catalog.list_products(page=1, page_size=1, is_active=True, db=db)
    assert first_page["total"] == 2
    assert first_page["page"] == 1
    assert len(first_page["products"]) == 1
    assert first_page["products"][0]["isActive"] is True

    inactive_page = catalog.list_products(page=1, page_size=10, is_active=False, db=db)
    assert inactive_page["total"] == 1
    assert inactive_page["products"][0]["id"] == inactive["id"]


def test_product_update_replaces_variants_and_status_can_be_changed(db):
    admin = _admin(db)
    created = catalog.create_product(_body(), db, admin)["product"]
    update = _body(
        name="Updated product",
        salesPrice=9900,
        variants=[
            {
                "attributeName": "Edition",
                "attributeValue": "Plus",
                "extraPrice": 1000,
            }
        ],
    )

    updated = catalog.update_product(created["id"], update, db, admin)["product"]
    assert updated["name"] == "Updated product"
    assert updated["salesPrice"] == 9900
    assert len(updated["variants"]) == 1
    assert updated["variants"][0]["attributeName"] == "Edition"
    assert updated["variants"][0]["finalPrice"] == 10900

    inactive = catalog.update_product_status(
        created["id"], ProductStatusRequest(isActive=False), db, admin
    )["product"]
    assert inactive["isActive"] is False
    active = catalog.update_product_status(
        created["id"], ProductStatusRequest(isActive=True), db, admin
    )["product"]
    assert active["isActive"] is True


def test_product_delete_cascades_variants_and_unknown_product_is_404(db):
    admin = _admin(db)
    created = catalog.create_product(_body(), db, admin)["product"]
    catalog.delete_product(created["id"], db, admin)

    assert db.get(Product, created["id"]) is None
    assert db.scalars(select(ProductVariant)).all() == []
    with pytest.raises(HTTPException) as missing:
        catalog.get_product(created["id"], db)
    assert missing.value.status_code == 404


def test_product_schema_rejects_negative_prices_and_blank_variant_fields():
    with pytest.raises(ValidationError):
        _body(salesPrice=-1)
    with pytest.raises(ValidationError):
        _body(variants=[{"attributeName": " ", "attributeValue": "Odoo", "extraPrice": 0}])
