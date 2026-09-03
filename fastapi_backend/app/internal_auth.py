import os

from fastapi import Header, HTTPException, status


INTERNAL_ADMIN_TOKEN = os.getenv(
    "INTERNAL_ADMIN_TOKEN"
)


def verify_internal_admin(
    x_internal_admin_token: str = Header(
        default=""
    ),
):
    if not INTERNAL_ADMIN_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal admin token is not configured.",
        )

    if x_internal_admin_token != INTERNAL_ADMIN_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal admin token.",
        )

    return True