from app.core.email import send_email


# ============================================================
# ORDER CONFIRMATION EMAIL
# ============================================================

async def send_order_confirmation_email(
    user_email: str,
    order_id: int,
    total: str,
):

    await send_email(
        to_email=user_email,

        subject=(
            f"Order #{order_id} Confirmed"
        ),

        body=(
            f"Hello,\n\n"
            f"Your order #{order_id} has been "
            f"confirmed successfully.\n\n"
            f"Order Total: ₹{total}\n\n"
            f"Thank you for shopping with "
            f"Smart E-Commerce."
        ),
    )


# ============================================================
# PAYMENT SUCCESS EMAIL
# ============================================================

async def send_payment_success_email(
    user_email: str,
    order_id: int,
    amount: str,
):

    await send_email(
        to_email=user_email,

        subject=(
            f"Payment Successful - Order #{order_id}"
        ),

        body=(
            f"Hello,\n\n"
            f"Your payment for Order #{order_id} "
            f"was successful.\n\n"
            f"Amount Paid: ₹{amount}\n\n"
            f"Thank you for your purchase."
        ),
    )


# ============================================================
# PAYMENT FAILURE EMAIL
# ============================================================

async def send_payment_failed_email(
    user_email: str,
    order_id: int,
):

    await send_email(
        to_email=user_email,

        subject=(
            f"Payment Failed - Order #{order_id}"
        ),

        body=(
            f"Hello,\n\n"
            f"Unfortunately, the payment for "
            f"Order #{order_id} failed.\n\n"
            f"Please try the payment again."
        ),
    )


# ============================================================
# SHIPPING UPDATE EMAIL
# ============================================================

async def send_shipping_update_email(
    user_email: str,
    order_id: int,
):

    await send_email(
        to_email=user_email,

        subject=(
            f"Order #{order_id} Shipped"
        ),

        body=(
            f"Hello,\n\n"
            f"Your Order #{order_id} has been "
            f"shipped.\n\n"
            f"You will receive it soon.\n\n"
            f"Thank you for shopping with "
            f"Smart E-Commerce."
        ),
    )