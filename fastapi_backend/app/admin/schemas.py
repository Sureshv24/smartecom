from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AdminReturnResponse(BaseModel):
    id: int
    order_id: int
    user_id: int

    reason: str
    comment: Optional[str] = None

    status: str
    created_at: datetime

    order_status: str
    payment_status: str
    total_amount: Decimal

    customer_name: str
    customer_email: str

    model_config = ConfigDict(
        from_attributes=True
    )


class AdminReturnActionResponse(BaseModel):
    message: str

    return_request_id: int
    order_id: int

    return_status: str
    order_status: str
    payment_status: str

    refund_status: Optional[str] = None
    stock_updated: bool = False

    model_config = ConfigDict(
        from_attributes=True
    )