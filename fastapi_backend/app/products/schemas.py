from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


# ============================================================
# CREATE PRODUCT
# ============================================================

class ProductCreate(BaseModel):
    name: str

    description: Optional[str] = None

    category: str = "General"

    price: Decimal

    stock: int = 0

    popularity: int = 0

    images: Optional[List[str]] = None


# ============================================================
# UPDATE PRODUCT
# ============================================================

class ProductUpdate(BaseModel):
    name: Optional[str] = None

    description: Optional[str] = None

    category: Optional[str] = None

    price: Optional[Decimal] = None

    stock: Optional[int] = None

    popularity: Optional[int] = None

    images: Optional[List[str]] = None


# ============================================================
# PRODUCT RESPONSE
# ============================================================

class ProductResponse(BaseModel):
    id: int

    name: str

    description: Optional[str] = None

    category: str

    price: Decimal

    stock: int

    popularity: int

    images: Optional[List[str]] = None

    model_config = ConfigDict(
        from_attributes=True
    )