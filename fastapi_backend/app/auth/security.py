from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import (
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)


# Password hashing
password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return password_hash.verify(
        plain_password,
        hashed_password
    )


# ============================================================
# ACCESS TOKEN
# ============================================================

def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "type": "access",
        "exp": expire,
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )


# ============================================================
# REFRESH TOKEN
# ============================================================

def create_refresh_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=REFRESH_TOKEN_EXPIRE_DAYS
    )

    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": expire,
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )


# ============================================================
# DECODE ACCESS TOKEN
# ============================================================

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )

        if payload.get("type") != "access":
            raise ValueError("Invalid token type")

        return payload

    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")

    except jwt.InvalidTokenError as error:
        print("ACCESS TOKEN ERROR:", error)
        raise ValueError("Invalid token")


# ============================================================
# DECODE REFRESH TOKEN
# ============================================================

def decode_refresh_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM]
        )

        print("REFRESH TOKEN PAYLOAD:", payload)

        if payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token type")

        return payload

    except jwt.ExpiredSignatureError:
        print("REFRESH TOKEN ERROR: Token expired")
        raise ValueError("Refresh token has expired")

    except jwt.InvalidTokenError as error:
        print("REFRESH TOKEN ERROR:", error)
        raise ValueError("Invalid refresh token")