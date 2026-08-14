from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Product

from app.auth.router import require_role
from app.auth.roles import UserRole

from app.products.schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
)


router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


# ============================================================
# CREATE PRODUCT
# POST /products
# ADMIN ONLY
# ============================================================

@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(UserRole.ADMIN)
    ),
):
    product = Product(
        name=product_data.name,
        description=product_data.description,
        category=product_data.category,
        price=product_data.price,
        stock=product_data.stock,
        popularity=product_data.popularity,
        images=product_data.images,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


# ============================================================
# GET ALL PRODUCTS
# GET /products
#
# Filters:
# ?category=Electronics
# ?min_price=1000
# ?max_price=5000
# ?popular=true
# ?in_stock=true
# ============================================================

@router.get(
    "",
    response_model=list[ProductResponse],
)
def get_products(
    category: str | None = Query(
        default=None,
        description="Filter by product category",
    ),

    min_price: float | None = Query(
        default=None,
        ge=0,
        description="Minimum product price",
    ),

    max_price: float | None = Query(
        default=None,
        ge=0,
        description="Maximum product price",
    ),

    popular: bool = Query(
        default=False,
        description="Sort by popularity when true",
    ),

    in_stock: bool = Query(
        default=False,
        description="Show only products with stock > 0",
    ),

    db: Session = Depends(get_db),

    current_user=Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.STAFF,
            UserRole.CUSTOMER,
        )
    ),
):
    query = db.query(Product)

    # --------------------------------------------------------
    # CATEGORY FILTER
    # --------------------------------------------------------

    if category:
        query = query.filter(
            Product.category.ilike(
                category.strip()
            )
        )

    # --------------------------------------------------------
    # MIN PRICE
    # --------------------------------------------------------

    if min_price is not None:
        query = query.filter(
            Product.price >= min_price
        )

    # --------------------------------------------------------
    # MAX PRICE
    # --------------------------------------------------------

    if max_price is not None:
        query = query.filter(
            Product.price <= max_price
        )

    # --------------------------------------------------------
    # VALIDATE PRICE RANGE
    # --------------------------------------------------------

    if (
        min_price is not None
        and max_price is not None
        and min_price > max_price
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_price cannot be greater than max_price",
        )

    # --------------------------------------------------------
    # STOCK FILTER
    # --------------------------------------------------------

    if in_stock:
        query = query.filter(
            Product.stock > 0
        )

    # --------------------------------------------------------
    # POPULARITY
    # --------------------------------------------------------

    if popular:
        query = query.order_by(
            Product.popularity.desc(),
            Product.id.desc(),
        )

    else:
        query = query.order_by(
            Product.id.desc()
        )

    return query.all()


# ============================================================
# GET PRODUCTS BY CATEGORY
# GET /products/category/{category}
#
# IMPORTANT:
# This route must come BEFORE /{product_id}
# ============================================================

@router.get(
    "/category/{category}",
    response_model=list[ProductResponse],
)
def get_products_by_category(
    category: str,
    db: Session = Depends(get_db),

    current_user=Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.STAFF,
            UserRole.CUSTOMER,
        )
    ),
):
    products = (
        db.query(Product)
        .filter(
            Product.category.ilike(
                category.strip()
            )
        )
        .order_by(
            Product.id.desc()
        )
        .all()
    )

    if not products:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"No products found "
                f"in category '{category}'"
            ),
        )

    return products


# ============================================================
# GET PRODUCT BY ID
# GET /products/{product_id}
# ADMIN / STAFF / CUSTOMER
# ============================================================

@router.get(
    "/{product_id}",
    response_model=ProductResponse,
)
def get_product(
    product_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.STAFF,
            UserRole.CUSTOMER,
        )
    ),
):
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
            detail="Product not found",
        )

    return product


# ============================================================
# UPDATE PRODUCT
# PUT /products/{product_id}
# ADMIN ONLY
# ============================================================

@router.put(
    "/{product_id}",
    response_model=ProductResponse,
)
def update_product(
    product_id: int,

    product_data: ProductUpdate,

    db: Session = Depends(get_db),

    current_user=Depends(
        require_role(UserRole.ADMIN)
    ),
):
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
            detail="Product not found",
        )

    update_data = product_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(
            product,
            field,
            value,
        )

    db.commit()
    db.refresh(product)

    return product


# ============================================================
# DELETE PRODUCT
# DELETE /products/{product_id}
# ADMIN ONLY
# ============================================================

@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product(
    product_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(
        require_role(UserRole.ADMIN)
    ),
):
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
            detail="Product not found",
        )

    db.delete(product)
    db.commit()

    return None