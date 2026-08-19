from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class CheckoutResponse(BaseModel):
    order_id: int

    subtotal: Decimal

    tax: Decimal

    total: Decimal

    currency: str

    checkout_url: str

    session_id: str

    payment_status: str

    order_status: str

    model_config = ConfigDict(
        from_attributes=True
    )