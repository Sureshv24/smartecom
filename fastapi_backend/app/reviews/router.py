from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.router import get_current_user_object
from app.db.database import get_db
from app.db.models import (
    Order,
    OrderItem,
    Product,
    Review,
)

from app.reviews.schemas import (
    ReviewCreate,
    ReviewResponse,
    ProductReviewsResponse,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    tags=["Reviews"],
)


# ============================================================
# POST /reviews
# CREATE REVIEW
# ============================================================

@router.post(
    "/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user_object
    ),
):

    # --------------------------------------------------------
    # CHECK PRODUCT
    # --------------------------------------------------------

    product = (
        db.query(Product)
        .filter(
            Product.id == review_data.product_id
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    # --------------------------------------------------------
    # CHECK COMPLETED ORDER
    # --------------------------------------------------------

    completed_order = (
        db.query(Order)
        .join(
            OrderItem,
            OrderItem.order_id == Order.id,
        )
        .filter(
            Order.user_id == current_user.id,
            OrderItem.product_id == review_data.product_id,
            Order.order_status == "delivered",
        )
        .first()
    )

    if not completed_order:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You can review this product only "
                "after completing an order."
            ),
        )

    # --------------------------------------------------------
    # ONE REVIEW PER USER PER PRODUCT
    # --------------------------------------------------------

    existing_review = (
        db.query(Review)
        .filter(
            Review.user_id == current_user.id,
            Review.product_id == review_data.product_id,
        )
        .first()
    )

    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "You have already reviewed this product."
            ),
        )

    # --------------------------------------------------------
    # CREATE REVIEW
    # --------------------------------------------------------

    review = Review(
        user_id=current_user.id,
        product_id=review_data.product_id,
        rating=review_data.rating,
        comment=review_data.comment,
        status="approved",
    )

    db.add(review)
    db.commit()
    db.refresh(review)

    return review


# ============================================================
# GET /products/{product_id}/reviews
# GET PRODUCT REVIEWS
# ============================================================

@router.get(
    "/products/{product_id}/reviews",
    response_model=ProductReviewsResponse,
)
def get_product_reviews(
    product_id: int,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # CHECK PRODUCT
    # --------------------------------------------------------

    product = (
        db.query(Product)
        .filter(
            Product.id == product_id
        )
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    # --------------------------------------------------------
    # GET APPROVED REVIEWS
    # --------------------------------------------------------

    reviews = (
        db.query(Review)
        .filter(
            Review.product_id == product_id,
            Review.status == "approved",
        )
        .order_by(
            Review.created_at.desc()
        )
        .all()
    )

    # --------------------------------------------------------
    # RATING AGGREGATION
    # --------------------------------------------------------

    aggregation = (
        db.query(
            func.avg(Review.rating),
            func.count(Review.id),
        )
        .filter(
            Review.product_id == product_id,
            Review.status == "approved",
        )
        .first()
    )

    average_rating = (
        float(aggregation[0])
        if aggregation[0] is not None
        else 0.0
    )

    total_reviews = int(
        aggregation[1] or 0
    )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {
        "product_id": product_id,
        "average_rating": round(
            average_rating,
            2,
        ),
        "total_reviews": total_reviews,
        "reviews": reviews,
    }