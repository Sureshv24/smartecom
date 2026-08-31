from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import (
    User,
    Product,
    Cart,
    Order,
    OrderItem,
    ReturnRequest,
)

from app.auth.router import require_role
from app.auth.roles import UserRole

from app.orders.schemas import (
    OrderResponse,
    ReturnRequestCreate,
    ReturnRequestResponse,
)


router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


# ============================================================
# CREATE ORDER
# ============================================================

@router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_order(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.CUSTOMER)
    ),
):
    cart_items = (
        db.query(Cart)
        .filter(
            Cart.user_id == current_user.id
        )
        .all()
    )

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )

    total_amount = Decimal("0.00")

    order_items_data = []

    for cart_item in cart_items:

        product = (
            db.query(Product)
            .filter(
                Product.id == cart_item.product_id
            )
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"Product "
                    f"{cart_item.product_id} "
                    f"not found"
                ),
            )

        if cart_item.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid cart quantity",
            )

        if product.stock < cart_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock "
                    f"for {product.name}"
                ),
            )

        price = Decimal(
            str(product.price)
        )

        subtotal = (
            price * cart_item.quantity
        )

        total_amount += subtotal

        order_items_data.append(
            {
                "product": product,
                "quantity": cart_item.quantity,
                "price": price,
                "subtotal": subtotal,
            }
        )

    order = Order(
        user_id=current_user.id,
        total_amount=total_amount,
        payment_status="pending",
        order_status="pending",
    )

    db.add(order)

    db.flush()

    for item in order_items_data:

        product = item["product"]

        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                quantity=item["quantity"],
                price=item["price"],
                subtotal=item["subtotal"],
            )
        )

    # Do not reduce stock or clear cart
    # until payment succeeds.

    db.commit()

    db.refresh(order)

    return order


# ============================================================
# GET MY ORDERS
# ============================================================

@router.get(
    "",
    response_model=list[OrderResponse],
)
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.CUSTOMER)
    ),
):
    return (
        db.query(Order)
        .filter(
            Order.user_id == current_user.id
        )
        .order_by(
            Order.created_at.desc()
        )
        .all()
    )


# ============================================================
# GET SINGLE ORDER
# ============================================================

@router.get(
    "/{order_id}",
    response_model=OrderResponse,
)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.CUSTOMER)
    ),
):
    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.user_id == current_user.id,
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    return order


# ============================================================
# REQUEST RETURN
# ============================================================

@router.post(
    "/{order_id}/return",
    response_model=ReturnRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def request_return(
    order_id: int,
    return_data: ReturnRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(UserRole.CUSTOMER)
    ),
):
    # --------------------------------------------------------
    # FIND CUSTOMER'S ORDER
    # --------------------------------------------------------

    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.user_id == current_user.id,
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # --------------------------------------------------------
    # CHECK ORDER STATUS
    # --------------------------------------------------------

    if (
        not order.order_status
        or order.order_status.lower()
        != "delivered"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Return can only be requested "
                "for delivered orders."
            ),
        )

    # --------------------------------------------------------
    # CHECK RETURN WINDOW
    #
    # Current Order model does not contain a delivered_at
    # column, so created_at is used as the available date
    # for the 7-day return window.
    # --------------------------------------------------------

    if not order.created_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Return window cannot be "
                "validated for this order."
            ),
        )

    current_time = datetime.utcnow()

    return_deadline = (
        order.created_at
        + timedelta(days=7)
    )

    if current_time > return_deadline:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "The 7-day return window "
                "has expired."
            ),
        )

    # --------------------------------------------------------
    # CHECK EXISTING PENDING REQUEST
    # --------------------------------------------------------

    existing_request = (
        db.query(ReturnRequest)
        .filter(
            ReturnRequest.order_id == order.id,
            ReturnRequest.user_id == current_user.id,
            ReturnRequest.status == "pending",
        )
        .first()
    )

    if existing_request:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "A return request is already "
                "pending for this order."
            ),
        )

    # --------------------------------------------------------
    # VALIDATE REASON
    # --------------------------------------------------------

    reason = return_data.reason.strip()

    if not reason:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Return reason is required.",
        )

    # --------------------------------------------------------
    # CLEAN COMMENT
    # --------------------------------------------------------

    comment = None

    if return_data.comment:

        cleaned_comment = (
            return_data.comment.strip()
        )

        if cleaned_comment:
            comment = cleaned_comment

    # --------------------------------------------------------
    # CREATE RETURN REQUEST
    # --------------------------------------------------------

    return_request = ReturnRequest(
        order_id=order.id,
        user_id=current_user.id,
        reason=reason,
        comment=comment,
        status="pending",
    )

    db.add(return_request)

    # --------------------------------------------------------
    # UPDATE ORDER STATUS
    # --------------------------------------------------------

    order.order_status = "Return Requested"

    db.commit()

    db.refresh(return_request)

    return return_request