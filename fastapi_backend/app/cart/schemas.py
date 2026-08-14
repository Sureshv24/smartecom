from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, ConfigDict


# ============================================================
# ADD TO CART
# ============================================================

class CartCreate(BaseModel):
    product_id: int
    quantity: int = 1


# ============================================================
# UPDATE CART
# ============================================================

class CartUpdate(BaseModel):
    quantity: int


# ============================================================
# PRODUCT INSIDE CART
# ============================================================

class ProductInCart(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: Decimal
    stock: int
    images: Optional[list] = None

    # New product fields
    category: Optional[str] = None
    popularity: int = 0

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# SINGLE CART ITEM
# ============================================================

class CartResponse(BaseModel):
    id: int
    product_id: int
    quantity: int

    product: ProductInCart

    # Quantity × product price
    item_total: Decimal


# ============================================================
# CART SUMMARY
# ============================================================

class CartSummaryResponse(BaseModel):
    items: List[CartResponse]

    # Total of all cart items
    subtotal: Decimal

    # Tax amount
    tax: Decimal

    # Subtotal + tax
    grand_total: Decimal