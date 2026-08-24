from sqlalchemy.orm import Session

from app.db.models import Notification


# ============================================================
# CREATE NOTIFICATION
# ============================================================

def create_notification(
    db: Session,
    user_id: int,
    notification_type: str,
    message: str,
):
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        message=message,
        read_status="unread",
    )

    db.add(notification)

    return notification