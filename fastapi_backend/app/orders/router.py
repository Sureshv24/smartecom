from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, Product, Cart, Order, OrderItem
from app.auth.router import require_role
from app.auth.roles import UserRole
from app.orders.schemas import OrderResponse


router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


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
        .filter(Cart.user_id == current_user.id)
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
            .filter(Product.id == cart_item.product_id)
            .first()
        )

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {cart_item.product_id} not found",
            )

        if cart_item.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid cart quantity",
            )

        if product.stock < cart_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {product.name}",
            )

        price = Decimal(str(product.price))
        subtotal = price * cart_item.quantity
        total_amount += subtotal

        order_items_data.append({
            "product": product,
            "quantity": cart_item.quantity,
            "price": price,
            "subtotal": subtotal,
        })

    order = Order(
        user_id=current_user.id,
        total_amount=total_amount,
        status="pending",
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

    # Don't reduce stock or clear cart until payment succeeds.
    db.commit()
    db.refresh(order)

    return order


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
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )


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