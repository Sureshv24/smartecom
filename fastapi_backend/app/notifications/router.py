from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.db.database import get_db

from app.db.models import Notification

from app.auth.router import (
    get_current_user_object,
)

from app.notifications.schemas import (
    NotificationResponse,
    NotificationReadRequest,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


# ============================================================
# GET /notifications
# ============================================================

@router.get(
    "",
    response_model=list[NotificationResponse],
)
def get_notifications(

    db: Session = Depends(get_db),

    current_user=Depends(
        get_current_user_object
    ),
):

    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id
            == current_user.id
        )
        .order_by(
            Notification.timestamp.desc()
        )
        .all()
    )

    return notifications


# ============================================================
# POST /notifications/read
# ============================================================

@router.post(
    "/read",
    response_model=NotificationResponse,
)
def mark_notification_read(

    notification_data:
        NotificationReadRequest,

    db: Session = Depends(get_db),

    current_user=Depends(
        get_current_user_object
    ),
):

    notification = (
        db.query(Notification)
        .filter(
            Notification.id
            == notification_data.notification_id,

            Notification.user_id
            == current_user.id,
        )
        .first()
    )


    if not notification:

        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Notification not found",
        )


    notification.read_status = "read"

    db.commit()

    db.refresh(notification)

    return notification