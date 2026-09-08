from pydantic import BaseModel, ConfigDict


# ============================================================
# RECOMMENDATION ITEM
# ============================================================

class RecommendationItem(BaseModel):

    id: int
    name: str
    category: str
    price: float
    stock: int
    popularity: int

    average_rating: float
    total_reviews: int

    score: float
    reason: str

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# USER RECOMMENDATIONS
# ============================================================

class RecommendationResponse(BaseModel):

    user_id: int

    recommendations: list[
        RecommendationItem
    ]


# ============================================================
# PRODUCT RECOMMENDATIONS
# ============================================================

class ProductRecommendationResponse(BaseModel):

    product_id: int | None = None

    products: list[
        RecommendationItem
    ]