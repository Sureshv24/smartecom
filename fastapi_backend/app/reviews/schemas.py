from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ============================================================
# CREATE REVIEW
# ============================================================

class ReviewCreate(BaseModel):

    product_id: int

    rating: int = Field(
        ge=1,
        le=5,
    )

    comment: Optional[str] = None


# ============================================================
# REVIEW RESPONSE
# ============================================================

class ReviewResponse(BaseModel):

    id: int

    user_id: int

    product_id: int

    rating: int

    comment: Optional[str] = None

    status: str

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# ============================================================
# REVIEW SUMMARY
# ============================================================

class ReviewSummary(BaseModel):

    average_rating: float

    total_reviews: int


# ============================================================
# PRODUCT REVIEWS RESPONSE
# ============================================================

class ProductReviewsResponse(BaseModel):

    product_id: int

    average_rating: float

    total_reviews: int

    reviews: list[ReviewResponse]