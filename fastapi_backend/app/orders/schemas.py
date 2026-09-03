from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# ORDER ITEM RESPONSE
# ============================================================

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    price: Decimal
    subtotal: Decimal

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# ORDER RESPONSE
# ============================================================

class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: Decimal

    # Actual SQLAlchemy model field
    order_status: str

    # Frontend-compatible status field.
    # Reads the same value from SQLAlchemy `order_status`.
    status: str = Field(
        validation_alias="order_status",
        serialization_alias="status",
    )

    payment_status: str
    created_at: datetime

    items: list[OrderItemResponse]

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


# ============================================================
# RETURN REQUEST CREATE
# ============================================================

class ReturnRequestCreate(BaseModel):
    reason: str
    comment: Optional[str] = None


# ============================================================
# RETURN REQUEST RESPONSE
# ============================================================

class ReturnRequestResponse(BaseModel):
    id: int
    order_id: int
    user_id: int

    reason: str
    comment: Optional[str] = None

    status: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )