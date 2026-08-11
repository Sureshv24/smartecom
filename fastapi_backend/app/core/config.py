import os

from dotenv import load_dotenv


load_dotenv()


# ============================================================
# DATABASE
# ============================================================

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")


# ============================================================
# JWT
# ============================================================

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not JWT_SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY is not configured")

JWT_ALGORITHM = os.getenv(
    "JWT_ALGORITHM",
    "HS256"
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "30"
    )
)

REFRESH_TOKEN_EXPIRE_DAYS = int(
    os.getenv(
        "REFRESH_TOKEN_EXPIRE_DAYS",
        "7"
    )
)


# ============================================================
# SESSION
# ============================================================

SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY")

if not SESSION_SECRET_KEY:
    raise RuntimeError(
        "SESSION_SECRET_KEY is not configured"
    )


# ============================================================
# AUTH0
# ============================================================

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")

AUTH0_CLIENT_ID = os.getenv("AUTH0_CLIENT_ID")

AUTH0_CLIENT_SECRET = os.getenv(
    "AUTH0_CLIENT_SECRET"
)

AUTH0_CALLBACK_URL = os.getenv(
    "AUTH0_CALLBACK_URL",
    "http://127.0.0.1:8000/auth/auth0/callback"
)


if not AUTH0_DOMAIN:
    raise RuntimeError(
        "AUTH0_DOMAIN is not configured"
    )

if not AUTH0_CLIENT_ID:
    raise RuntimeError(
        "AUTH0_CLIENT_ID is not configured"
    )

if not AUTH0_CLIENT_SECRET:
    raise RuntimeError(
        "AUTH0_CLIENT_SECRET is not configured"
    )


# Normalize Auth0 domain
AUTH0_DOMAIN = (
    AUTH0_DOMAIN
    .replace("https://", "")
    .replace("http://", "")
    .rstrip("/")
)