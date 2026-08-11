from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Cart, Product

from app.auth.router import get_current_user_object
from app.auth.roles import UserRole

from app.cart.schemas import (
    CartCreate,
    CartUpdate,
    CartResponse,
)


router = APIRouter(
    prefix="/cart",
    tags=["Cart"]
)


# ============================================================
# ADD PRODUCT TO CART
# POST /cart
# CUSTOMER ONLY
# ============================================================

@router.post(
    "",
    response_model=CartResponse,
    status_code=status.HTTP_201_CREATED
)
def add_to_cart(
    cart_data: CartCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_object),
):
    # --------------------------------------------------------
    # Only customers can manage carts
    # --------------------------------------------------------

    if current_user.role != UserRole.CUSTOMER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can manage cart"
        )

    # --------------------------------------------------------
    # Validate quantity
    # --------------------------------------------------------

    if cart_data.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than 0"
        )

    # --------------------------------------------------------
    # Find product
    # --------------------------------------------------------

    product = (
        db.query(Product)
        .filter(Product.id == cart_data.product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # --------------------------------------------------------
    # Check stock
    # --------------------------------------------------------

    if cart_data.quantity > product.stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {product.stock} items available"
        )

    # --------------------------------------------------------
    # Check whether product already exists in user's cart
    # --------------------------------------------------------

    existing_cart = (
        db.query(Cart)
        .filter(
            Cart.user_id == current_user.id,
            Cart.product_id == cart_data.product_id
        )
        .first()
    )

    # --------------------------------------------------------
    # If already exists, increase quantity
    # --------------------------------------------------------

    if existing_cart:

        new_quantity = (
            existing_cart.quantity +
            cart_data.quantity
        )

        if new_quantity > product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {product.stock} items available"
            )

        existing_cart.quantity = new_quantity

        db.commit()
        db.refresh(existing_cart)

        return {
            "id": existing_cart.id,
            "product_id": existing_cart.product_id,
            "quantity": existing_cart.quantity,
            "product": product
        }

    # --------------------------------------------------------
    # Create new cart item
    # --------------------------------------------------------

    new_cart = Cart(
        user_id=current_user.id,
        product_id=cart_data.product_id,
        quantity=cart_data.quantity
    )

    db.add(new_cart)
    db.commit()
    db.refresh(new_cart)

    return {
        "id": new_cart.id,
        "product_id": new_cart.product_id,
        "quantity": new_cart.quantity,
        "product": product
    }


# ============================================================
# GET CURRENT USER CART
# GET /cart
# CUSTOMER ONLY
# ============================================================

@router.get(
    "",
    response_model=list[CartResponse]
)
def get_cart(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_object),
):
    if current_user.role != UserRole.CUSTOMER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can access cart"
        )

    cart_items = (
        db.query(Cart, Product)
        .join(
            Product,
            Cart.product_id == Product.id
        )
        .filter(
            Cart.user_id == current_user.id
        )
        .all()
    )

    response = []

    for cart, product in cart_items:
        response.append({
            "id": cart.id,
            "product_id": cart.product_id,
            "quantity": cart.quantity,
            "product": product
        })

    return response


# ============================================================
# UPDATE CART QUANTITY
# PUT /cart/{cart_id}
# CUSTOMER ONLY
# ============================================================

@router.put(
    "/{cart_id}",
    response_model=CartResponse
)
def update_cart(
    cart_id: int,
    cart_data: CartUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_object),
):
    if current_user.role != UserRole.CUSTOMER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can manage cart"
        )

    # --------------------------------------------------------
    # Validate quantity
    # --------------------------------------------------------

    if cart_data.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than 0"
        )

    # --------------------------------------------------------
    # Find cart item belonging to current user
    # --------------------------------------------------------

    cart = (
        db.query(Cart)
        .filter(
            Cart.id == cart_id,
            Cart.user_id == current_user.id
        )
        .first()
    )

    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    # --------------------------------------------------------
    # Find product
    # --------------------------------------------------------

    product = (
        db.query(Product)
        .filter(Product.id == cart.product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # --------------------------------------------------------
    # Check stock
    # --------------------------------------------------------

    if cart_data.quantity > product.stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only {product.stock} items available"
        )

    # --------------------------------------------------------
    # Update quantity
    # --------------------------------------------------------

    cart.quantity = cart_data.quantity

    db.commit()
    db.refresh(cart)

    return {
        "id": cart.id,
        "product_id": cart.product_id,
        "quantity": cart.quantity,
        "product": product
    }


# ============================================================
# REMOVE CART ITEM
# DELETE /cart/{cart_id}
# CUSTOMER ONLY
# ============================================================

@router.delete(
    "/{cart_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def remove_from_cart(
    cart_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_object),
):
    if current_user.role != UserRole.CUSTOMER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can manage cart"
        )

    cart = (
        db.query(Cart)
        .filter(
            Cart.id == cart_id,
            Cart.user_id == current_user.id
        )
        .first()
    )

    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    db.delete(cart)
    db.commit()

    return None