from collections import Counter

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth.router import (
    get_current_user_object,
)

from app.db.database import (
    get_db,
)

from app.recommendations.schemas import (
    RecommendationItem,
    RecommendationResponse,
    ProductRecommendationResponse,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    tags=["Recommendations"]
)


# ============================================================
# HELPER
# BUILD RECOMMENDATION ITEM
# ============================================================

def build_recommendation_item(
    row,
    score,
    reason,
):
    return {
        "id": int(row["id"]),
        "name": row["name"],
        "category": row["category"],
        "price": float(row["price"]),
        "stock": int(row["stock"] or 0),
        "popularity": int(row["popularity"] or 0),
        "average_rating": round(
            float(
                row["average_rating"] or 0
            ),
            2,
        ),
        "total_reviews": int(
            row["total_reviews"] or 0
        ),
        "score": round(
            float(score),
            2,
        ),
        "reason": reason,
    }


# ============================================================
# GET USER PURCHASE HISTORY
# ============================================================

def get_user_purchase_history(
    db: Session,
    user_id: int,
):
    query = text(
        """
        SELECT
            oi.product_id,
            p.category,
            oi.quantity

        FROM order_items oi

        INNER JOIN orders o
            ON o.id = oi.order_id

        INNER JOIN products p
            ON p.id = oi.product_id

        WHERE
            o.user_id = :user_id
            AND o.payment_status = 'paid'
            AND o.order_status IN (
                'paid',
                'shipped',
                'delivered'
            )

        ORDER BY
            o.created_at DESC
        """
    )

    result = db.execute(
        query,
        {
            "user_id": user_id,
        },
    )

    return result.mappings().all()


# ============================================================
# GET PURCHASED PRODUCT IDS
# ============================================================

def get_purchased_product_ids(
    purchase_rows,
):
    return {
        int(row["product_id"])
        for row in purchase_rows
    }



# ============================================================
# GET USER BROWSING HISTORY
# ============================================================

def get_user_browsing_history(
    db: Session,
    user_id: int,
):
    query = text(
        """
        SELECT
            pv.product_id,
            p.category,
            COUNT(*) AS view_count,
            MAX(pv.viewed_at) AS last_viewed_at

        FROM product_views pv

        INNER JOIN products p
            ON p.id = pv.product_id

        WHERE
            pv.user_id = :user_id

        GROUP BY
            pv.product_id,
            p.category

        ORDER BY
            last_viewed_at DESC
        """
    )

    result = db.execute(
        query,
        {
            "user_id": user_id,
        },
    )

    return result.mappings().all()


# ============================================================
# GET USER RECOMMENDATIONS
#
# GET /recommendations/{user_id}
# ============================================================

@router.get(
    "/recommendations/{user_id}",
    response_model=RecommendationResponse,
)
def get_recommendations(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user_object
    ),
):
    # --------------------------------------------------------
    # SECURITY
    # --------------------------------------------------------

    if int(current_user.id) != int(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You can only view your own recommendations."
            ),
        )

    # --------------------------------------------------------
    # PURCHASE HISTORY
    # --------------------------------------------------------

    purchase_rows = get_user_purchase_history(
        db,
        user_id,
    )

    purchased_product_ids = (
        get_purchased_product_ids(
            purchase_rows
        )
    )

    # --------------------------------------------------------
    # BROWSING HISTORY
    # --------------------------------------------------------

    browsing_rows = get_user_browsing_history(
        db,
        user_id,
    )

    # --------------------------------------------------------
    # BROWSED CATEGORY PREFERENCE
    # --------------------------------------------------------

    browse_category_counter = Counter()

    for row in browsing_rows:
        category = str(
            row["category"] or "General"
        )

        view_count = int(
            row["view_count"] or 0
        )

        browse_category_counter[category] += view_count

    # --------------------------------------------------------
    # CATEGORY PREFERENCE
    # --------------------------------------------------------

    category_counter = Counter()

    for row in purchase_rows:
        category = str(
            row["category"] or "General"
        )

        quantity = int(
            row["quantity"] or 1
        )

        category_counter[category] += quantity

    # --------------------------------------------------------
    # PRODUCT CANDIDATES
    # --------------------------------------------------------

    query = text(
        """
        SELECT

            p.id,
            p.name,
            p.category,
            p.price,
            p.stock,
            p.popularity,

            COALESCE(
                AVG(
                    CASE
                        WHEN r.status = 'approved'
                        THEN r.rating
                    END
                ),
                0
            ) AS average_rating,

            COUNT(
                CASE
                    WHEN r.status = 'approved'
                    THEN r.id
                END
            ) AS total_reviews,

            COALESCE(
                MAX(uv.user_view_count),
                0
            ) AS user_view_count,

            COALESCE(
                MAX(gv.total_view_count),
                0
            ) AS total_view_count

        FROM products p

        LEFT JOIN reviews r
            ON r.product_id = p.id

        LEFT JOIN (
            SELECT
                product_id,
                COUNT(*) AS user_view_count
            FROM product_views
            WHERE user_id = :user_id
            GROUP BY product_id
        ) uv
            ON uv.product_id = p.id

        LEFT JOIN (
            SELECT
                product_id,
                COUNT(*) AS total_view_count
            FROM product_views
            GROUP BY product_id
        ) gv
            ON gv.product_id = p.id

        WHERE p.stock > 0

        GROUP BY
            p.id,
            p.name,
            p.category,
            p.price,
            p.stock,
            p.popularity

        ORDER BY
            p.popularity DESC
        """
    )

    result = db.execute(
        query,
        {
            "user_id": user_id,
        },
    )

    rows = result.mappings().all()

    recommendations = []

    # --------------------------------------------------------
    # SCORE PRODUCTS
    # --------------------------------------------------------

    for row in rows:
        product_id = int(row["id"])

        # Don't recommend already purchased products
        if product_id in purchased_product_ids:
            continue

        category = str(
            row["category"] or "General"
        )

        popularity = int(
            row["popularity"] or 0
        )

        average_rating = float(
            row["average_rating"] or 0
        )

        total_reviews = int(
            row["total_reviews"] or 0
        )

        user_view_count = int(
            row["user_view_count"] or 0
        )

        total_view_count = int(
            row["total_view_count"] or 0
        )

        category_score = category_counter.get(
            category,
            0,
        )

        browse_category_score = (
            browse_category_counter.get(
                category,
                0,
            )
        )

        # ----------------------------------------------------
        # RECOMMENDATION SCORE
        # ----------------------------------------------------

        score = (
            category_score * 5
            + browse_category_score * 3
            + user_view_count * 1.5
            + total_view_count * 0.05
            + average_rating * 2
            + popularity * 0.10
            + total_reviews * 0.25
        )

        # ----------------------------------------------------
        # RECOMMENDATION REASON
        # ----------------------------------------------------

        if user_view_count > 0:
            reason = (
                "Recommended based on "
                "products you recently viewed."
            )

        elif browse_category_score > 0:
            reason = (
                "Recommended based on "
                "your browsing interests."
            )

        elif category_score > 0:
            reason = (
                "Recommended based on "
                "your previous purchases."
            )

        elif average_rating >= 4.5:
            reason = (
                "Highly rated by customers."
            )

        elif total_view_count > 0:
            reason = (
                "Popular among other shoppers."
            )

        elif popularity > 0:
            reason = (
                "Popular with other shoppers."
            )

        else:
            reason = (
                "Recommended for you."
            )

        recommendations.append(
            build_recommendation_item(
                row,
                score,
                reason,
            )
        )

    # --------------------------------------------------------
    # SORT BY SCORE
    # --------------------------------------------------------

    recommendations.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    # --------------------------------------------------------
    # TOP 10
    # --------------------------------------------------------

    recommendations = recommendations[:10]

    return {
        "user_id": user_id,
        "recommendations": recommendations,
    }


# ============================================================
# GET SIMILAR PRODUCTS
#
# GET /products/{product_id}/similar
# ============================================================

@router.get(
    "/products/{product_id}/similar",
    response_model=ProductRecommendationResponse,
)
def get_similar_products(
    product_id: int,
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # GET BASE PRODUCT
    # --------------------------------------------------------

    base_query = text(
        """
        SELECT
            id,
            category,
            price

        FROM products

        WHERE id = :product_id

        LIMIT 1
        """
    )

    base_result = db.execute(
        base_query,
        {
            "product_id": product_id,
        },
    )

    base_product = (
        base_result.mappings().first()
    )

    if not base_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    # --------------------------------------------------------
    # FIND SIMILAR PRODUCTS
    # --------------------------------------------------------

    query = text(
        """
        SELECT

            p.id,
            p.name,
            p.category,
            p.price,
            p.stock,
            p.popularity,

            COALESCE(
                AVG(
                    CASE
                        WHEN r.status = 'approved'
                        THEN r.rating
                    END
                ),
                0
            ) AS average_rating,

            COUNT(
                CASE
                    WHEN r.status = 'approved'
                    THEN r.id
                END
            ) AS total_reviews,

            (
                CASE
                    WHEN p.category = :category
                    THEN 10
                    ELSE 0
                END

                +

                COALESCE(
                    AVG(
                        CASE
                            WHEN r.status = 'approved'
                            THEN r.rating
                        END
                    ),
                    0
                ) * 2

                +

                p.popularity * 0.10

                -

                ABS(
                    p.price - :price
                ) / 10000
            ) AS recommendation_score

        FROM products p

        LEFT JOIN reviews r
            ON r.product_id = p.id

        WHERE
            p.id != :product_id
            AND p.stock > 0

        GROUP BY
            p.id,
            p.name,
            p.category,
            p.price,
            p.stock,
            p.popularity

        ORDER BY
            recommendation_score DESC

        LIMIT 8
        """
    )

    result = db.execute(
        query,
        {
            "product_id": product_id,
            "category": base_product["category"],
            "price": base_product["price"],
        },
    )

    rows = result.mappings().all()

    products = []

    for row in rows:
        same_category = (
            row["category"]
            == base_product["category"]
        )

        if same_category:
            reason = (
                "Similar category and "
                "customer interest."
            )
        else:
            reason = (
                "Recommended based on "
                "rating and popularity."
            )

        products.append(
            build_recommendation_item(
                row,
                row["recommendation_score"],
                reason,
            )
        )

    return {
        "product_id": product_id,
        "products": products,
    }


# ============================================================
# GET TRENDING PRODUCTS
#
# GET /products/trending
# ============================================================

@router.get(
    "/products/trending",
    response_model=ProductRecommendationResponse,
)
def get_trending_products(
    db: Session = Depends(get_db),
):
    query = text(
        """
        SELECT

            p.id,
            p.name,
            p.category,
            p.price,
            p.stock,
            p.popularity,

            COALESCE(
                AVG(
                    CASE
                        WHEN r.status = 'approved'
                        THEN r.rating
                    END
                ),
                0
            ) AS average_rating,

            COUNT(
                CASE
                    WHEN r.status = 'approved'
                    THEN r.id
                END
            ) AS total_reviews

        FROM products p

        LEFT JOIN reviews r
            ON r.product_id = p.id

        WHERE p.stock > 0

        GROUP BY
            p.id,
            p.name,
            p.category,
            p.price,
            p.stock,
            p.popularity

        ORDER BY
            p.popularity DESC,
            average_rating DESC,
            total_reviews DESC

        LIMIT 10
        """
    )

    result = db.execute(query)

    rows = result.mappings().all()

    products = []

    for row in rows:
        popularity = int(
            row["popularity"] or 0
        )

        average_rating = float(
            row["average_rating"] or 0
        )

        total_reviews = int(
            row["total_reviews"] or 0
        )

        score = (
            popularity * 0.10
            + average_rating * 2
            + total_reviews * 0.25
        )

        products.append(
            build_recommendation_item(
                row,
                score,
                "Trending and popular right now.",
            )
        )

    return {
        "product_id": None,
        "products": products,
    }