from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
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
    tags=["Products"]
)


# ============================================================
# CREATE PRODUCT
# POST /products
# ADMIN ONLY
# ============================================================

@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED
)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(UserRole.ADMIN)
    )
):

    product = Product(
        name=product_data.name,
        description=product_data.description,
        price=product_data.price,
        stock=product_data.stock,
        images=product_data.images,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


# ============================================================
# GET ALL PRODUCTS
# GET /products
# ADMIN / STAFF / CUSTOMER
# ============================================================

@router.get(
    "",
    response_model=list[ProductResponse]
)
def get_products(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.STAFF,
            UserRole.CUSTOMER
        )
    )
):

    products = (
        db.query(Product)
        .order_by(Product.id.desc())
        .all()
    )

    return products


# ============================================================
# GET PRODUCT BY ID
# GET /products/{product_id}
# ADMIN / STAFF / CUSTOMER
# ============================================================

@router.get(
    "/{product_id}",
    response_model=ProductResponse
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(
            UserRole.ADMIN,
            UserRole.STAFF,
            UserRole.CUSTOMER
        )
    )
):

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    return product


# ============================================================
# UPDATE PRODUCT
# PUT /products/{product_id}
# ADMIN ONLY
# ============================================================

@router.put(
    "/{product_id}",
    response_model=ProductResponse
)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(UserRole.ADMIN)
    )
):

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    update_data = product_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(product, field, value)

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
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(UserRole.ADMIN)
    )
):

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    db.delete(product)
    db.commit()

    return None