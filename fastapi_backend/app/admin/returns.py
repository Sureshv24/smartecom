import os
from decimal import Decimal

import stripe

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import (
    Order,
    OrderItem,
    Payment,
    Product,
)

from app.auth.router import require_role
from app.auth.roles import UserRole
from app.internal_auth import verify_internal_admin

from app.notifications.utils import (
    create_notification,
)

from app.admin.schemas import (
    AdminReturnResponse,
    AdminReturnActionResponse,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/admin",
    tags=["Admin - Returns"],
)


# ============================================================
# STRIPE CONFIGURATION
# ============================================================

STRIPE_SECRET_KEY = os.getenv(
    "STRIPE_SECRET_KEY"
)

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


# ============================================================
# EMAIL HELPER
# ============================================================

def send_email_notification(
    email: str,
    subject: str,
    message: str,
):
    """
    Email sending is intentionally best-effort.

    The API must not fail just because SMTP is not configured.
    """

    try:
        smtp_host = os.getenv(
            "SMTP_HOST"
        )

        smtp_port = int(
            os.getenv(
                "SMTP_PORT",
                "587",
            )
        )

        smtp_username = os.getenv(
            "SMTP_USERNAME"
        )

        smtp_password = os.getenv(
            "SMTP_PASSWORD"
        )

        smtp_from = os.getenv(
            "SMTP_FROM_EMAIL",
            smtp_username or "",
        )

        smtp_use_tls = (
            os.getenv(
                "SMTP_USE_TLS",
                "true",
            ).lower()
            == "true"
        )

        if not smtp_host or not smtp_username or not smtp_password:
            print(
                "Email notification skipped: "
                "SMTP configuration is missing."
            )
            return

        import smtplib
        from email.message import EmailMessage

        email_message = EmailMessage()

        email_message["Subject"] = subject
        email_message["From"] = smtp_from
        email_message["To"] = email

        email_message.set_content(
            message
        )

        with smtplib.SMTP(
            smtp_host,
            smtp_port,
            timeout=20,
        ) as server:

            if smtp_use_tls:
                server.starttls()

            server.login(
                smtp_username,
                smtp_password,
            )

            server.send_message(
                email_message
            )

        print(
            f"Email notification sent to {email}"
        )

    except Exception as error:
        print(
            "Email notification failed:",
            error,
        )


# ============================================================
# GET RETURN REQUEST
# ============================================================

def get_return_request(
    db: Session,
    return_id: int,
):
    query = text(
        """
        SELECT
            r.id,
            r.order_id,
            r.user_id,
            r.reason,
            r.comment,
            r.status,
            r.created_at,

            o.order_status,
            o.payment_status,
            o.total_amount,

            u.name AS customer_name,
            u.email AS customer_email

        FROM return_requests r

        INNER JOIN orders o
            ON o.id = r.order_id

        INNER JOIN users u
            ON u.id = r.user_id

        WHERE r.id = :return_id

        LIMIT 1
        """
    )

    result = db.execute(
        query,
        {
            "return_id": return_id,
        },
    )

    return result.mappings().first()


# ============================================================
# GET ALL RETURNS
# GET /admin/returns
# ADMIN ONLY
# ============================================================

@router.get(
    "/returns",
    response_model=list[
        AdminReturnResponse
    ],
)
def get_all_returns(
    db: Session = Depends(get_db),
    current_admin=Depends(
        require_role(
            UserRole.ADMIN
        )
    ),
):
    query = text(
        """
        SELECT
            r.id,
            r.order_id,
            r.user_id,
            r.reason,
            r.comment,
            r.status,
            r.created_at,

            o.order_status,
            o.payment_status,
            o.total_amount,

            u.name AS customer_name,
            u.email AS customer_email

        FROM return_requests r

        INNER JOIN orders o
            ON o.id = r.order_id

        INNER JOIN users u
            ON u.id = r.user_id

        ORDER BY
            r.created_at DESC,
            r.id DESC
        """
    )

    result = db.execute(
        query
    )

    rows = result.mappings().all()

    return [
        dict(row)
        for row in rows
    ]


# ============================================================
# APPROVE RETURN
# POST /admin/returns/{id}/approve
# ADMIN ONLY
# ============================================================

@router.post(
    "/returns/{return_id}/approve",
    response_model=AdminReturnActionResponse,
)
def approve_return(
    return_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin=Depends(
        require_role(
            UserRole.ADMIN
        )
    ),
):
    # --------------------------------------------------------
    # Get return request
    # --------------------------------------------------------

    return_request = get_return_request(
        db,
        return_id,
    )

    if not return_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return request not found",
        )


    # --------------------------------------------------------
    # Check current return status
    # --------------------------------------------------------

    return_status = str(
        return_request["status"]
    ).strip().lower()

    if return_status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Only pending return requests "
                "can be approved."
            ),
        )


    # --------------------------------------------------------
    # Check order status
    # --------------------------------------------------------

    order_status = str(
        return_request["order_status"]
    ).strip().lower()

    if order_status not in {
        "return requested",
        "return_requested",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Order must be in "
                "'Return Requested' status."
            ),
        )


    # --------------------------------------------------------
    # Get order
    # --------------------------------------------------------

    order = (
        db.query(Order)
        .filter(
            Order.id
            == return_request["order_id"]
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )


    # --------------------------------------------------------
    # Get payment
    # --------------------------------------------------------

    payment = (
        db.query(Payment)
        .filter(
            Payment.order_id
            == order.id
        )
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Payment record not found "
                "for this order."
            ),
        )


    # --------------------------------------------------------
    # Payment must be paid
    # --------------------------------------------------------

    if str(
        payment.status
    ).lower() != "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Return cannot be refunded "
                "because payment is not marked as paid."
            ),
        )


    # --------------------------------------------------------
    # Stripe configuration
    # --------------------------------------------------------

    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Stripe secret key is not configured."
            ),
        )


    # --------------------------------------------------------
    # Get Stripe transaction identifier
    # --------------------------------------------------------

    transaction_id = (
        payment.transaction_id
    )

    if not transaction_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Stripe transaction ID is "
                "missing for this payment."
            ),
        )


    # --------------------------------------------------------
    # Resolve PaymentIntent ID
    #
    # Supports both:
    #
    # pi_xxxxx
    # cs_test_xxxxx
    #
    # Older orders may contain a Checkout Session ID.
    # --------------------------------------------------------

    payment_intent_id = transaction_id

    if transaction_id.startswith(
        "cs_"
    ):

        try:
            session = (
                stripe.checkout.Session.retrieve(
                    transaction_id
                )
            )

            payment_intent_id = (
                session.payment_intent
            )

        except Exception as error:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=(
                    "Unable to retrieve Stripe "
                    f"Checkout Session: {error}"
                ),
            )


    if not payment_intent_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Stripe PaymentIntent could not "
                "be determined."
            ),
        )


    # --------------------------------------------------------
    # Create Stripe refund
    # --------------------------------------------------------

    try:

        refund = stripe.Refund.create(
            payment_intent=
                payment_intent_id,

            reason=
                "requested_by_customer",

            metadata={
                "order_id":
                    str(order.id),

                "return_request_id":
                    str(return_id),
            },
        )

    except stripe.error.StripeError as error:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                f"Stripe refund failed: {error}"
            ),
        )


    refund_status = str(
        refund.status or ""
    ).lower()


    # --------------------------------------------------------
    # Only continue for valid Stripe refund states
    # --------------------------------------------------------

    if refund_status not in {
        "succeeded",
        "pending",
    }:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Stripe returned an unexpected "
                f"refund status: {refund_status}"
            ),
        )


    # --------------------------------------------------------
    # Update transaction ID
    # --------------------------------------------------------

    payment.transaction_id = (
        payment_intent_id
    )


    # --------------------------------------------------------
    # Update return request
    # --------------------------------------------------------

    db.execute(
        text(
            """
            UPDATE return_requests
            SET status = 'approved'
            WHERE id = :return_id
            """
        ),
        {
            "return_id":
                return_id,
        },
    )


    # --------------------------------------------------------
    # Approved → Returned
    # --------------------------------------------------------

    order.order_status = (
        "returned"
    )


    # --------------------------------------------------------
    # Increase inventory
    #
    # Only once because we allow approval
    # only from pending status.
    # --------------------------------------------------------

    order_items = (
        db.query(OrderItem)
        .filter(
            OrderItem.order_id
            == order.id
        )
        .all()
    )

    for order_item in order_items:

        product = (
            db.query(Product)
            .filter(
                Product.id
                == order_item.product_id
            )
            .first()
        )

        if product:
            product.stock = (
                product.stock
                + order_item.quantity
            )


    # --------------------------------------------------------
    # Refund completed immediately
    # --------------------------------------------------------

    if refund_status == "succeeded":

        payment.status = (
            "refunded"
        )

        order.payment_status = (
            "refunded"
        )


    # --------------------------------------------------------
    # Save all DB changes
    # --------------------------------------------------------

    db.commit()


    # --------------------------------------------------------
    # In-app notification:
    # Return approved
    # --------------------------------------------------------

    create_notification(
        db=db,
        user_id=order.user_id,
        notification_type=
            "return_approved",
        message=(
            f"Return request for "
            f"Order #{order.id} "
            f"has been approved."
        ),
    )

    # Notification helper may need its own commit
    db.commit()


    # --------------------------------------------------------
    # Email:
    # Return approved
    # --------------------------------------------------------

    background_tasks.add_task(
        send_email_notification,
        return_request["customer_email"],
        f"Return Approved - Order #{order.id}",
        (
            f"Hello "
            f"{return_request['customer_name']},\n\n"
            f"Your return request for "
            f"Order #{order.id} has been approved.\n\n"
            f"Return reason: "
            f"{return_request['reason']}\n\n"
            f"Thank you,\n"
            f"Smart E-Commerce"
        ),
    )


    # --------------------------------------------------------
    # Refund already completed
    # --------------------------------------------------------

    if refund_status == "succeeded":

        create_notification(
            db=db,
            user_id=order.user_id,
            notification_type=
                "refund_completed",
            message=(
                f"Refund completed for "
                f"Order #{order.id}."
            ),
        )

        db.commit()


        background_tasks.add_task(
            send_email_notification,
            return_request["customer_email"],
            f"Refund Completed - Order #{order.id}",
            (
                f"Hello "
                f"{return_request['customer_name']},\n\n"
                f"Your refund for "
                f"Order #{order.id} "
                f"has been completed.\n\n"
                f"Refund amount: "
                f"₹{order.total_amount}\n\n"
                f"Thank you,\n"
                f"Smart E-Commerce"
            ),
        )


    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {
        "message": (
            "Return approved successfully."
            if refund_status
            == "succeeded"
            else
            "Return approved. Stripe refund is pending."
        ),

        "return_request_id":
            return_id,

        "order_id":
            order.id,

        "return_status":
            "approved",

        "order_status":
            order.order_status,

        "payment_status":
            order.payment_status,

        "refund_status":
            refund_status,

        "stock_updated":
            True,
    }


# ============================================================
# REJECT RETURN
# POST /admin/returns/{id}/reject
# ADMIN ONLY
# ============================================================

@router.post(
    "/returns/{return_id}/reject",
    response_model=AdminReturnActionResponse,
)
def reject_return(
    return_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_admin=Depends(
        require_role(
            UserRole.ADMIN
        )
    ),
):
    # --------------------------------------------------------
    # Get return request
    # --------------------------------------------------------

    return_request = get_return_request(
        db,
        return_id,
    )

    if not return_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return request not found",
        )


    # --------------------------------------------------------
    # Only pending can be rejected
    # --------------------------------------------------------

    current_status = str(
        return_request["status"]
    ).strip().lower()

    if current_status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Only pending return requests "
                "can be rejected."
            ),
        )


    # --------------------------------------------------------
    # Reject request
    # --------------------------------------------------------

    db.execute(
        text(
            """
            UPDATE return_requests
            SET status = 'rejected'
            WHERE id = :return_id
            """
        ),
        {
            "return_id":
                return_id,
        },
    )


    # --------------------------------------------------------
    # Update order
    # --------------------------------------------------------

    order = (
        db.query(Order)
        .filter(
            Order.id
            == return_request["order_id"]
        )
        .first()
    )

    if not order:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )


    order.order_status = (
        "rejected"
    )


    # --------------------------------------------------------
    # Save
    # --------------------------------------------------------

    db.commit()


    # --------------------------------------------------------
    # In-app notification
    # --------------------------------------------------------

    create_notification(
        db=db,
        user_id=order.user_id,
        notification_type=
            "return_rejected",
        message=(
            f"Return request for "
            f"Order #{order.id} "
            f"has been rejected."
        ),
    )

    db.commit()


    # --------------------------------------------------------
    # Email
    # --------------------------------------------------------

    background_tasks.add_task(
        send_email_notification,
        return_request["customer_email"],
        f"Return Rejected - Order #{order.id}",
        (
            f"Hello "
            f"{return_request['customer_name']},\n\n"
            f"Your return request for "
            f"Order #{order.id} "
            f"has been rejected.\n\n"
            f"Return reason: "
            f"{return_request['reason']}\n\n"
            f"Thank you,\n"
            f"Smart E-Commerce"
        ),
    )


    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "message":
            "Return rejected successfully.",

        "return_request_id":
            return_id,

        "order_id":
            order.id,

        "return_status":
            "rejected",

        "order_status":
            order.order_status,

        "payment_status":
            order.payment_status,

        "refund_status":
            None,

        "stock_updated":
            False,
    }
# ============================================================
# INTERNAL DJANGO ADMIN - APPROVE RETURN
# ============================================================

@router.post(
    "/internal/returns/{return_id}/approve",
    response_model=AdminReturnActionResponse,
)
def internal_approve_return(
    return_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _authorized=Depends(verify_internal_admin),
):
    return approve_return(
        return_id=return_id,
        background_tasks=background_tasks,
        db=db,
        current_admin=True,
    )


# ============================================================
# INTERNAL DJANGO ADMIN - REJECT RETURN
# ============================================================

@router.post(
    "/internal/returns/{return_id}/reject",
    response_model=AdminReturnActionResponse,
)
def internal_reject_return(
    return_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _authorized=Depends(verify_internal_admin),
):
    return reject_return(
        return_id=return_id,
        background_tasks=background_tasks,
        db=db,
        current_admin=True,
    )