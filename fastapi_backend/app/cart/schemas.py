from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CartCreate(BaseModel):
    product_id: int
    quantity: int = 1


class CartUpdate(BaseModel):
    quantity: int


class ProductInCart(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: Decimal
    stock: int
    images: Optional[list] = None

    model_config = ConfigDict(
        from_attributes=True
    )


class CartResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductInCart