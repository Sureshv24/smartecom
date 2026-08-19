import os
from decimal import Decimal, ROUND_HALF_UP

import stripe

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    status,
)

from sqlalchemy.orm import Session

from app.db.database import get_db

from app.db.models import (
    Cart,
    Product,
    Order,
    OrderItem,
    Payment,
)

from app.auth.router import (
    get_current_user_object,
)

from app.checkout.schemas import (
    CheckoutResponse,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/checkout",
    tags=["Checkout"],
)


# ============================================================
# CONFIGURATION
# ============================================================

STRIPE_SECRET_KEY = os.getenv(
    "STRIPE_SECRET_KEY"
)

STRIPE_CURRENCY = os.getenv(
    "STRIPE_CURRENCY",
    "inr",
).lower()

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
)

TAX_RATE = Decimal("0.05")


# ============================================================
# STRIPE CONFIGURATION
# ============================================================

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


# ============================================================
# HELPER - ROUND MONEY
# ============================================================

def money(value: Decimal) -> Decimal:
    return value.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


# ============================================================
# HELPER - FIND ORDER
# ============================================================

def get_order(
    db: Session,
    order_id: int,
):
    return (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )


# ============================================================
# HELPER - MARK PAYMENT AS PAID
# ============================================================

def mark_payment_paid(
    db: Session,
    order_id: int,
    transaction_id: str | None = None,
):

    order = get_order(
        db,
        order_id,
    )

    if not order:
        return False


    payment = (
        db.query(Payment)
        .filter(
            Payment.order_id == order.id
        )
        .first()
    )


    if payment:

        payment.status = "paid"

        payment.payment_method = "stripe"

        if transaction_id:
            payment.transaction_id = (
                transaction_id
            )


    # --------------------------------------------------------
    # Update order
    # --------------------------------------------------------

    order.payment_status = "paid"

    order.order_status = "paid"


    # --------------------------------------------------------
    # Clear user's cart after successful payment
    # --------------------------------------------------------

    db.query(Cart).filter(
        Cart.user_id == order.user_id
    ).delete(
        synchronize_session=False
    )


    db.commit()

    return True


# ============================================================
# HELPER - MARK PAYMENT AS FAILED
# ============================================================

def mark_payment_failed(
    db: Session,
    order_id: int,
    transaction_id: str | None = None,
):

    order = get_order(
        db,
        order_id,
    )

    if not order:
        return False


    payment = (
        db.query(Payment)
        .filter(
            Payment.order_id == order.id
        )
        .first()
    )


    if payment:

        payment.status = "failed"

        if transaction_id:

            payment.transaction_id = (
                transaction_id
            )


    order.payment_status = "failed"

    order.order_status = "cancelled"


    db.commit()

    return True


# ============================================================
# POST /checkout
# ============================================================

@router.post(
    "",
    response_model=CheckoutResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_checkout(

    db: Session = Depends(
        get_db
    ),

    current_user=Depends(
        get_current_user_object
    ),
):

    # ========================================================
    # CHECK STRIPE CONFIGURATION
    # ========================================================

    if not STRIPE_SECRET_KEY:

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Stripe secret key is not configured. "
                "Add STRIPE_SECRET_KEY to your .env file."
            ),
        )


    # ========================================================
    # GET CURRENT USER CART
    # ========================================================

    cart_items = (
        db.query(
            Cart,
            Product
        )
        .join(
            Product,
            Cart.product_id == Product.id,
        )
        .filter(
            Cart.user_id ==
            current_user.id,
        )
        .all()
    )


    # ========================================================
    # EMPTY CART
    # ========================================================

    if not cart_items:

        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail="Cart is empty.",
        )


    # ========================================================
    # CALCULATE SUBTOTAL
    # ========================================================

    subtotal = Decimal(
        "0.00"
    )

    validated_items = []


    for cart, product in cart_items:

        # ----------------------------------------------------
        # Validate quantity
        # ----------------------------------------------------

        if cart.quantity <= 0:

            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),
                detail=(
                    f"Invalid quantity for "
                    f"{product.name}."
                ),
            )


        # ----------------------------------------------------
        # Validate stock
        # ----------------------------------------------------

        if cart.quantity > product.stock:

            raise HTTPException(
                status_code=(
                    status.HTTP_400_BAD_REQUEST
                ),
                detail=(
                    f"Only {product.stock} "
                    f"{product.name} items "
                    f"are available."
                ),
            )


        # ----------------------------------------------------
        # Product price
        # ----------------------------------------------------

        price = Decimal(
            str(product.price)
        )


        # ----------------------------------------------------
        # Item subtotal
        # ----------------------------------------------------

        item_subtotal = money(
            price * cart.quantity
        )


        subtotal += item_subtotal


        validated_items.append(
            {
                "cart": cart,
                "product": product,
                "price": price,
                "subtotal": item_subtotal,
            }
        )


    subtotal = money(
        subtotal
    )


    # ========================================================
    # TAX
    # ========================================================

    tax = money(
        subtotal * TAX_RATE
    )


    # ========================================================
    # GRAND TOTAL
    # ========================================================

    total = money(
        subtotal + tax
    )


    # ========================================================
    # CREATE ORDER
    # ========================================================

    order = Order(

        user_id=current_user.id,

        total_amount=total,

        payment_status="pending",

        order_status="pending",
    )


    db.add(order)

    # Generate order ID
    db.flush()


    # ========================================================
    # CREATE ORDER ITEMS
    # ========================================================

    for item in validated_items:

        cart = item["cart"]

        product = item["product"]

        price = item["price"]

        item_subtotal = item["subtotal"]


        order_item = OrderItem(

            order_id=order.id,

            product_id=product.id,

            product_name=product.name,

            quantity=cart.quantity,

            price=price,

            subtotal=item_subtotal,
        )


        db.add(order_item)


    # ========================================================
    # CREATE PAYMENT
    # ========================================================

    payment = Payment(

        order_id=order.id,

        amount=total,

        payment_method="stripe",

        status="pending",
    )


    db.add(payment)

    db.flush()


    # ========================================================
    # STRIPE LINE ITEMS
    # ========================================================

    stripe_line_items = []


    for item in validated_items:

        cart = item["cart"]

        product = item["product"]

        price = item["price"]


        # Stripe uses smallest currency unit.
        #
        # Example:
        # ₹2,999 = 299900 paise

        unit_amount = int(
            money(
                price * 100
            )
        )


        stripe_line_items.append(
            {
                "price_data": {

                    "currency":
                        STRIPE_CURRENCY,

                    "product_data": {

                        "name":
                            product.name,

                        "description":
                            (
                                product.description
                                or ""
                            ),
                    },

                    "unit_amount":
                        unit_amount,
                },

                "quantity":
                    cart.quantity,
            }
        )


    # ========================================================
    # CREATE STRIPE CHECKOUT SESSION
    # ========================================================

    try:

        session = (
            stripe.checkout.Session.create(

                mode="payment",

                line_items=
                    stripe_line_items,

                # ------------------------------------------------
                # SUCCESS URL
                # ------------------------------------------------

                success_url=(
                    f"{FRONTEND_URL}"
                    f"/?checkout=success"
                    f"&session_id="
                    "{CHECKOUT_SESSION_ID}"
                ),

                # ------------------------------------------------
                # CANCEL URL
                # ------------------------------------------------

                cancel_url=(
                    f"{FRONTEND_URL}"
                    f"/?checkout=cancel"
                ),

                # ------------------------------------------------
                # Customer email
                # ------------------------------------------------

                customer_email=
                    current_user.email,

                # ------------------------------------------------
                # Internal order reference
                # ------------------------------------------------

                client_reference_id=
                    str(order.id),

                # ------------------------------------------------
                # Session metadata
                # ------------------------------------------------

                metadata={
                    "order_id":
                        str(order.id),
                },

                # ------------------------------------------------
                # PaymentIntent metadata
                # ------------------------------------------------

                payment_intent_data={

                    "metadata": {

                        "order_id":
                            str(order.id),
                    },
                },
            )
        )


    except stripe.error.StripeError as error:

        db.rollback()

        raise HTTPException(
            status_code=(
                status.HTTP_502_BAD_GATEWAY
            ),
            detail=(
                f"Stripe error: {str(error)}"
            ),
        )


    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "Checkout initialization failed: "
                f"{str(error)}"
            ),
        )


    # ========================================================
    # SAVE STRIPE SESSION ID
    # ========================================================

    payment.transaction_id = (
        session.id
    )


    # ========================================================
    # COMMIT
    # ========================================================

    db.commit()

    db.refresh(order)

    db.refresh(payment)


    # ========================================================
    # RESPONSE
    # ========================================================

    return CheckoutResponse(

        order_id=order.id,

        subtotal=subtotal,

        tax=tax,

        total=total,

        currency=STRIPE_CURRENCY,

        checkout_url=session.url,

        session_id=session.id,

        payment_status=
            payment.status,

        order_status=
            order.order_status,
    )


# ============================================================
# STRIPE WEBHOOK
# POST /checkout/webhook
# ============================================================

@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
)
async def stripe_webhook(

    request: Request,

    db: Session = Depends(
        get_db
    ),
):

    # ========================================================
    # READ RAW BODY
    # ========================================================

    payload = await request.body()


    # ========================================================
    # GET STRIPE SIGNATURE
    # ========================================================

    signature = request.headers.get(
        "Stripe-Signature"
    )


    # ========================================================
    # GET WEBHOOK SECRET
    # ========================================================

    webhook_secret = os.getenv(
        "STRIPE_WEBHOOK_SECRET"
    )


    if not webhook_secret:

        raise HTTPException(
            status_code=(
                status.HTTP_500_INTERNAL_SERVER_ERROR
            ),
            detail=(
                "STRIPE_WEBHOOK_SECRET "
                "is not configured."
            ),
        )


    if not signature:

        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Missing Stripe-Signature header."
            ),
        )


    # ========================================================
    # VERIFY STRIPE WEBHOOK
    # ========================================================

    try:

        event = (
            stripe.Webhook.construct_event(
                payload,
                signature,
                webhook_secret,
            )
        )


    except ValueError:

        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Invalid webhook payload."
            ),
        )


    except stripe.error.SignatureVerificationError:

        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Invalid Stripe webhook signature."
            ),
        )


    # ========================================================
    # EVENT INFORMATION
    # ========================================================

    event_type = event["type"]

    event_data = event["data"]["object"]


    # ========================================================
    # PAYMENT INTENT SUCCEEDED
    # ========================================================

    if event_type == (
        "payment_intent.succeeded"
    ):

        payment_intent = event_data


        metadata = (
            payment_intent.get(
                "metadata",
                {}
            )
        )


        order_id = metadata.get(
            "order_id"
        )


        transaction_id = (
            payment_intent.get("id")
        )


        if order_id:

            mark_payment_paid(

                db=db,

                order_id=int(
                    order_id
                ),

                transaction_id=
                    transaction_id,
            )


    # ========================================================
    # PAYMENT INTENT FAILED
    # ========================================================

    elif event_type == (
        "payment_intent.payment_failed"
    ):

        payment_intent = event_data


        metadata = (
            payment_intent.get(
                "metadata",
                {}
            )
        )


        order_id = metadata.get(
            "order_id"
        )


        transaction_id = (
            payment_intent.get("id")
        )


        if order_id:

            mark_payment_failed(

                db=db,

                order_id=int(
                    order_id
                ),

                transaction_id=
                    transaction_id,
            )


    # ========================================================
    # CHECKOUT SESSION COMPLETED
    # ========================================================

    elif event_type == (
        "checkout.session.completed"
    ):

        session = event_data


        metadata = (
            session.get(
                "metadata",
                {}
            )
        )


        order_id = metadata.get(
            "order_id"
        )


        payment_status = (
            session.get(
                "payment_status"
            )
        )


        payment_intent_id = (
            session.get(
                "payment_intent"
            )
        )


        if (
            order_id
            and payment_status == "paid"
        ):

            mark_payment_paid(

                db=db,

                order_id=int(
                    order_id
                ),

                transaction_id=
                    payment_intent_id,
            )


    # ========================================================
    # CHECKOUT SESSION EXPIRED
    # ========================================================

    elif event_type == (
        "checkout.session.expired"
    ):

        session = event_data


        metadata = (
            session.get(
                "metadata",
                {}
            )
        )


        order_id = metadata.get(
            "order_id"
        )


        if order_id:

            order = get_order(

                db,

                int(
                    order_id
                ),
            )


            if order:

                payment = (
                    db.query(Payment)
                    .filter(
                        Payment.order_id
                        == order.id
                    )
                    .first()
                )


                if payment:

                    payment.status = (
                        "failed"
                    )


                order.payment_status = (
                    "failed"
                )

                order.order_status = (
                    "cancelled"
                )


                db.commit()


    # ========================================================
    # OTHER EVENTS
    # ========================================================

    else:

        print(
            "Unhandled Stripe event:",
            event_type,
        )


    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "received": True,
        "event_type": event_type,
    }