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

from app.notifications.websocket import manager


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/cart",
    tags=["Cart"],
)


# ============================================================
# TAX CONFIGURATION
# ============================================================

TAX_RATE = Decimal("0.05")


# ============================================================
# CUSTOMER-ONLY ACCESS
# ============================================================

def check_customer(current_user):

    if current_user.role != UserRole.CUSTOMER.value:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can manage cart",
        )


# ============================================================
# GET PRODUCT
# ============================================================

def get_product_or_404(
    product_id: int,
    db: Session,
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
# GET CART ITEM FOR CURRENT USER
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
# BUILD CART ITEM RESPONSE
# ============================================================

def build_cart_item_response(
    cart: Cart,
    product: Product,
):

    price = Decimal(
        str(product.price)
    )

    quantity = Decimal(
        str(cart.quantity)
    )

    item_total = (
        price * quantity
    ).quantize(
        Decimal("0.01")
    )

    return {
        "id": cart.id,
        "product_id": cart.product_id,
        "quantity": cart.quantity,
        "product": product,
        "item_total": item_total,
    }


# ============================================================
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

        item_response = (
            build_cart_item_response(
                cart,
                product,
            )
        )

        item_total = (
            item_response["item_total"]
        )

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
# BROADCAST CART UPDATED
# ============================================================

async def broadcast_cart_updated(
    current_user,
    cart_id,
    product_id,
    quantity,
    action,
):

    await manager.broadcast(
        {
            "type": "cart_updated",

            "user_id":
                current_user.id,

            "cart_id":
                cart_id,

            "product_id":
                product_id,

            "quantity":
                quantity,

            "action":
                action,
        }
    )


# ============================================================
# ADD PRODUCT TO CART
#
# POST /cart/add
# ============================================================

@router.post(
    "/add",
    response_model=CartResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_to_cart_new(
    cart_data: CartCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user_object
    ),
):

    check_customer(
        current_user
    )


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
                f"Only {product.stock} "
                f"items available"
            ),
        )


    # --------------------------------------------------------
    # Check existing cart item
    # --------------------------------------------------------

    existing_cart = (
        db.query(Cart)
        .filter(
            Cart.user_id == current_user.id,
            Cart.product_id ==
                cart_data.product_id,
        )
        .first()
    )


    # ========================================================
    # EXISTING ITEM
    # ========================================================

    if existing_cart:

        new_quantity = (
            existing_cart.quantity
            + cart_data.quantity
        )


        if new_quantity > product.stock:

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Only {product.stock} "
                    f"items available"
                ),
            )


        existing_cart.quantity = (
            new_quantity
        )

        db.commit()

        db.refresh(
            existing_cart
        )


        # ----------------------------------------------------
        # REAL-TIME CART EVENT
        # ----------------------------------------------------

        await broadcast_cart_updated(
            current_user=current_user,

            cart_id=
                existing_cart.id,

            product_id=
                existing_cart.product_id,

            quantity=
                existing_cart.quantity,

            action=
                "quantity_updated",
        )


        return build_cart_item_response(
            existing_cart,
            product,
        )


    # ========================================================
    # CREATE NEW CART ITEM
    # ========================================================

    new_cart = Cart(
        user_id=current_user.id,

        product_id=
            cart_data.product_id,

        quantity=
            cart_data.quantity,
    )


    db.add(new_cart)

    db.commit()

    db.refresh(
        new_cart
    )


    # --------------------------------------------------------
    # REAL-TIME CART EVENT
    # --------------------------------------------------------

    await broadcast_cart_updated(
        current_user=current_user,

        cart_id=
            new_cart.id,

        product_id=
            new_cart.product_id,

        quantity=
            new_cart.quantity,

        action=
            "added",
    )


    return build_cart_item_response(
        new_cart,
        product,
    )


# ============================================================
# LEGACY ADD ENDPOINT
#
# POST /cart
# ============================================================

@router.post(
    "",
    response_model=CartResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_to_cart_legacy(
    cart_data: CartCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user_object
    ),
):

    return await add_to_cart_new(
        cart_data=cart_data,
        db=db,
        current_user=current_user,
    )


# ============================================================
# GET CURRENT USER CART
#
# GET /cart
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

    check_customer(
        current_user
    )

    return calculate_cart_summary(
        current_user,
        db,
    )


# ============================================================
# UPDATE CART
#
# PUT /cart/update?cart_id=1
# ============================================================

@router.put(
    "/update",
    response_model=CartResponse,
)
async def update_cart_new(
    cart_id: int,
    cart_data: CartUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user_object
    ),
):

    check_customer(
        current_user
    )


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
                f"Only {product.stock} "
                f"items available"
            ),
        )


    # --------------------------------------------------------
    # Update quantity
    # --------------------------------------------------------

    cart.quantity = (
        cart_data.quantity
    )

    db.commit()

    db.refresh(
        cart
    )


    # --------------------------------------------------------
    # REAL-TIME CART EVENT
    # --------------------------------------------------------

    await broadcast_cart_updated(
        current_user=current_user,

        cart_id=
            cart.id,

        product_id=
            cart.product_id,

        quantity=
            cart.quantity,

        action=
            "quantity_updated",
    )


    return build_cart_item_response(
        cart,
        product,
    )


# ============================================================
# LEGACY UPDATE ENDPOINT
#
# PUT /cart/{cart_id}
# ============================================================

@router.put(
    "/{cart_id}",
    response_model=CartResponse,
)
async def update_cart_legacy(
    cart_id: int,
    cart_data: CartUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user_object
    ),
):

    return await update_cart_new(
        cart_id=cart_id,
        cart_data=cart_data,
        db=db,
        current_user=current_user,
    )


# ============================================================
# REMOVE CART ITEM
#
# DELETE /cart/remove?cart_id=1
# ============================================================

@router.delete(
    "/remove",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_from_cart_new(
    cart_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user_object
    ),
):

    check_customer(
        current_user
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
    # Save information before delete
    # --------------------------------------------------------

    product_id = cart.product_id


    # --------------------------------------------------------
    # Delete
    # --------------------------------------------------------

    db.delete(
        cart
    )

    db.commit()


    # --------------------------------------------------------
    # REAL-TIME CART EVENT
    # --------------------------------------------------------

    await broadcast_cart_updated(
        current_user=current_user,

        cart_id=
            cart_id,

        product_id=
            product_id,

        quantity=
            0,

        action=
            "removed",
    )


    return None


# ============================================================
# LEGACY DELETE ENDPOINT
#
# DELETE /cart/{cart_id}
# ============================================================

@router.delete(
    "/{cart_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_from_cart_legacy(
    cart_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_user_object
    ),
):

    return await remove_from_cart_new(
        cart_id=cart_id,
        db=db,
        current_user=current_user,
    )