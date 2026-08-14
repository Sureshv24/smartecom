from decimal import Decimal

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
    CartSummaryResponse,
)


router = APIRouter(
    prefix="/cart",
    tags=["Cart"],
)


# ============================================================
# TAX CONFIGURATION
# ============================================================

# 5% tax
TAX_RATE = Decimal("0.05")


# ============================================================
# HELPER
# CUSTOMER-ONLY ACCESS
# ============================================================

def check_customer(current_user):
    if current_user.role != UserRole.CUSTOMER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can manage cart",
        )


# ============================================================
# HELPER
# GET PRODUCT
# ============================================================

def get_product_or_404(
    product_id: int,
    db: Session,
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    return product


# ============================================================
# HELPER
# GET CART ITEM BELONGING TO CURRENT USER
# ============================================================

def get_cart_or_404(
    cart_id: int,
    current_user,
    db: Session,
):
    cart = (
        db.query(Cart)
        .filter(
            Cart.id == cart_id,
            Cart.user_id == current_user.id,
        )
        .first()
    )

    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found",
        )

    return cart


# ============================================================
# HELPER
# BUILD CART ITEM RESPONSE
# ============================================================

def build_cart_item_response(
    cart: Cart,
    product: Product,
):
    price = Decimal(str(product.price))
    quantity = Decimal(str(cart.quantity))

    item_total = price * quantity

    return {
        "id": cart.id,
        "product_id": cart.product_id,
        "quantity": cart.quantity,
        "product": product,
        "item_total": item_total.quantize(
            Decimal("0.01")
        ),
    }


# ============================================================
# HELPER
# GET ALL CURRENT USER CART ITEMS
# ============================================================

def get_user_cart_items(
    current_user,
    db: Session,
):
    cart_items = (
        db.query(Cart, Product)
        .join(
            Product,
            Cart.product_id == Product.id,
        )
        .filter(
            Cart.user_id == current_user.id,
        )
        .all()
    )

    return cart_items


# ============================================================
# HELPER
# CALCULATE CART SUMMARY
# ============================================================

def calculate_cart_summary(
    current_user,
    db: Session,
):
    cart_items = get_user_cart_items(
        current_user,
        db,
    )

    items = []

    subtotal = Decimal("0.00")

    for cart, product in cart_items:

        item_response = build_cart_item_response(
            cart,
            product,
        )

        item_total = item_response["item_total"]

        subtotal += item_total

        items.append(
            item_response
        )

    # --------------------------------------------------------
    # SUBTOTAL
    # --------------------------------------------------------

    subtotal = subtotal.quantize(
        Decimal("0.01")
    )

    # --------------------------------------------------------
    # TAX
    # --------------------------------------------------------

    tax = (
        subtotal * TAX_RATE
    ).quantize(
        Decimal("0.01")
    )

    # --------------------------------------------------------
    # GRAND TOTAL
    # --------------------------------------------------------

    grand_total = (
        subtotal + tax
    ).quantize(
        Decimal("0.01")
    )

    return {
        "items": items,
        "subtotal": subtotal,
        "tax": tax,
        "grand_total": grand_total,
    }


# ============================================================
# ADD PRODUCT TO CART
#
# POST /cart/add
#
# CUSTOMER ONLY
# ============================================================

@router.post(
    "/add",
    response_model=CartResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_to_cart_new(
    cart_data: CartCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user_object
    ),
):
    check_customer(current_user)

    # --------------------------------------------------------
    # Validate quantity
    # --------------------------------------------------------

    if cart_data.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than 0",
        )

    # --------------------------------------------------------
    # Find product
    # --------------------------------------------------------

    product = get_product_or_404(
        cart_data.product_id,
        db,
    )

    # --------------------------------------------------------
    # Check stock
    # --------------------------------------------------------

    if cart_data.quantity > product.stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Only {product.stock} items available"
            ),
        )

    # --------------------------------------------------------
    # Check existing cart item
    # --------------------------------------------------------

    existing_cart = (
        db.query(Cart)
        .filter(
            Cart.user_id == current_user.id,
            Cart.product_id == cart_data.product_id,
        )
        .first()
    )

    # --------------------------------------------------------
    # Existing item → increase quantity
    # --------------------------------------------------------

    if existing_cart:

        new_quantity = (
            existing_cart.quantity
            + cart_data.quantity
        )

        if new_quantity > product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Only {product.stock} items available"
                ),
            )

        existing_cart.quantity = new_quantity

        db.commit()
        db.refresh(existing_cart)

        return build_cart_item_response(
            existing_cart,
            product,
        )

    # --------------------------------------------------------
    # Create new cart item
    # --------------------------------------------------------

    new_cart = Cart(
        user_id=current_user.id,
        product_id=cart_data.product_id,
        quantity=cart_data.quantity,
    )

    db.add(new_cart)

    db.commit()
    db.refresh(new_cart)

    return build_cart_item_response(
        new_cart,
        product,
    )


# ============================================================
# LEGACY ADD ENDPOINT
#
# POST /cart
#
# KEPT FOR EXISTING FRONTEND
# ============================================================

@router.post(
    "",
    response_model=CartResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_to_cart_legacy(
    cart_data: CartCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user_object
    ),
):
    return add_to_cart_new(
        cart_data=cart_data,
        db=db,
        current_user=current_user,
    )


# ============================================================
# GET CURRENT USER CART
#
# GET /cart
#
# CUSTOMER ONLY
#
# RETURNS:
# items
# subtotal
# tax
# grand_total
# ============================================================

@router.get(
    "",
    response_model=CartSummaryResponse,
)
def get_cart(
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user_object
    ),
):
    check_customer(current_user)

    return calculate_cart_summary(
        current_user,
        db,
    )


# ============================================================
# UPDATE CART
#
# PUT /cart/update?cart_id=1
#
# CUSTOMER ONLY
# ============================================================

@router.put(
    "/update",
    response_model=CartResponse,
)
def update_cart_new(
    cart_id: int,
    cart_data: CartUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user_object
    ),
):
    check_customer(current_user)

    # --------------------------------------------------------
    # Validate quantity
    # --------------------------------------------------------

    if cart_data.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quantity must be greater than 0",
        )

    # --------------------------------------------------------
    # Get cart item
    # --------------------------------------------------------

    cart = get_cart_or_404(
        cart_id,
        current_user,
        db,
    )

    # --------------------------------------------------------
    # Get product
    # --------------------------------------------------------

    product = get_product_or_404(
        cart.product_id,
        db,
    )

    # --------------------------------------------------------
    # Check stock
    # --------------------------------------------------------

    if cart_data.quantity > product.stock:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Only {product.stock} items available"
            ),
        )

    # --------------------------------------------------------
    # Update quantity
    # --------------------------------------------------------

    cart.quantity = cart_data.quantity

    db.commit()
    db.refresh(cart)

    return build_cart_item_response(
        cart,
        product,
    )


# ============================================================
# LEGACY UPDATE ENDPOINT
#
# PUT /cart/{cart_id}
#
# KEPT FOR EXISTING FRONTEND
# ============================================================

@router.put(
    "/{cart_id}",
    response_model=CartResponse,
)
def update_cart_legacy(
    cart_id: int,
    cart_data: CartUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user_object
    ),
):
    return update_cart_new(
        cart_id=cart_id,
        cart_data=cart_data,
        db=db,
        current_user=current_user,
    )


# ============================================================
# REMOVE CART ITEM
#
# DELETE /cart/remove?cart_id=1
#
# CUSTOMER ONLY
# ============================================================

@router.delete(
    "/remove",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_from_cart_new(
    cart_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user_object
    ),
):
    check_customer(current_user)

    # --------------------------------------------------------
    # Get cart item
    # --------------------------------------------------------

    cart = get_cart_or_404(
        cart_id,
        current_user,
        db,
    )

    # --------------------------------------------------------
    # Delete
    # --------------------------------------------------------

    db.delete(cart)
    db.commit()

    return None


# ============================================================
# LEGACY DELETE ENDPOINT
#
# DELETE /cart/{cart_id}
#
# KEPT FOR EXISTING FRONTEND
# ============================================================

@router.delete(
    "/{cart_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_from_cart_legacy(
    cart_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user_object
    ),
):
    return remove_from_cart_new(
        cart_id=cart_id,
        db=db,
        current_user=current_user,
    )