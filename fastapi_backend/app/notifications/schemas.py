from datetime import datetime

from pydantic import BaseModel, ConfigDict


# ============================================================
# NOTIFICATION RESPONSE
# ============================================================

class NotificationResponse(BaseModel):

    id: int

    user_id: int

    type: str

    message: str

    read_status: str

    timestamp: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# MARK NOTIFICATION AS READ
# ============================================================

class NotificationReadRequest(BaseModel):

    notification_id: int