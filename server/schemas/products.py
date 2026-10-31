from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator


NonEmptyName = Annotated[str, Field(min_length=1, max_length=160)]
ProductType = Annotated[str, Field(min_length=1, max_length=40)]
VariantAttribute = Annotated[str, Field(min_length=1, max_length=80)]
VariantValue = Annotated[str, Field(min_length=1, max_length=120)]
NonNegativePrice = Annotated[int, Field(ge=0)]


class ProductVariantRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    attribute_name: VariantAttribute = Field(alias="attributeName")
    attribute_value: VariantValue = Field(alias="attributeValue")
    extra_price: NonNegativePrice = Field(alias="extraPrice")

    @field_validator("attribute_name", "attribute_value")
    @classmethod
    def strip_variant_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value


class ProductUpsertRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: NonEmptyName
    type: ProductType
    sales_price: NonNegativePrice = Field(alias="salesPrice")
    cost_price: NonNegativePrice = Field(default=0, alias="costPrice")
    notes: str | None = None
    variants: list[ProductVariantRequest] = Field(default_factory=list)
    is_active: bool = Field(default=True, alias="isActive")

    @field_validator("name", "type")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field cannot be blank")
        return value

    @field_validator("notes")
    @classmethod
    def normalize_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class ProductStatusRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    is_active: bool = Field(alias="isActive")


class ProductVariantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    attribute_name: str = Field(alias="attributeName")
    attribute_value: str = Field(alias="attributeValue")
    extra_price: int = Field(alias="extraPrice")
    final_price: int = Field(alias="finalPrice")


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    name: str
    type: str
    sales_price: int = Field(alias="salesPrice")
    cost_price: int = Field(alias="costPrice")
    notes: str | None
    is_active: bool = Field(alias="isActive")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    variants: list[ProductVariantResponse]


class ProductEnvelope(BaseModel):
    product: ProductResponse


class ProductListEnvelope(BaseModel):
    products: list[ProductResponse]
    total: int
    page: int
    page_size: int = Field(alias="pageSize")
