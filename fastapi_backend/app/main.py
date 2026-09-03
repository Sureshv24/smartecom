# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

from dotenv import load_dotenv

load_dotenv()


# ============================================================
# FASTAPI IMPORTS
# ============================================================

from fastapi import (
    FastAPI,
    WebSocket,
    WebSocketDisconnect,
)

from fastapi.middleware.cors import CORSMiddleware

from starlette.middleware.sessions import SessionMiddleware
from app.admin.returns import router as admin_returns_router

# ============================================================
# DATABASE
# ============================================================

from app.db.database import (
    engine,
    Base,
)

from app.db import models


# ============================================================
# AUTH
# ============================================================

from app.auth.router import (
    router as auth_router,
)


# ============================================================
# PRODUCTS
# ============================================================

from app.products.router import (
    router as product_router,
)


# ============================================================
# CART
# ============================================================

from app.cart.router import (
    router as cart_router,
)


# ============================================================
# ORDERS
# ============================================================

from app.orders.router import (
    router as order_router,
)


# ============================================================
# CHECKOUT
# ============================================================

from app.checkout.router import (
    router as checkout_router,
)


# ============================================================
# NOTIFICATIONS
# ============================================================

from app.notifications.router import (
    router as notification_router,
)


# ============================================================
# WEBSOCKET CONNECTION MANAGER
# ============================================================

from app.notifications.websocket import (
    manager,
)


# ============================================================
# CONFIGURATION
# ============================================================

from app.core.config import (
    JWT_SECRET_KEY,
)


# ============================================================
# CREATE DATABASE TABLES
# ============================================================

Base.metadata.create_all(
    bind=engine
)


# ============================================================
# CREATE FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Smart E-Commerce Platform API",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# SESSION MIDDLEWARE
# ============================================================

app.add_middleware(
    SessionMiddleware,
    secret_key=JWT_SECRET_KEY,
)


# ============================================================
# API ROUTES
# ============================================================

app.include_router(
    auth_router
)

app.include_router(
    product_router
)

app.include_router(
    cart_router
)

app.include_router(
    order_router
)

app.include_router(
    checkout_router
)

app.include_router(
    notification_router
)
app.include_router(
    admin_returns_router
)

# ============================================================
# WEBSOCKET DIRECT REGISTRATION
# ============================================================

@app.websocket(
    "/ws/notifications"
)
async def websocket_notifications(
    websocket: WebSocket,
):

    print(
        "WebSocket connection request received..."
    )

    await manager.connect(
        websocket
    )

    try:

        while True:

            data = await websocket.receive_text()

            print(
                "WebSocket received:",
                data
            )

            # -----------------------------------------------
            # Ping / Pong
            # -----------------------------------------------

            if data == "ping":

                await websocket.send_json(
                    {
                        "type": "pong"
                    }
                )

    except WebSocketDisconnect:

        manager.disconnect(
            websocket
        )

    except Exception as error:

        print(
            "WebSocket error:",
            error
        )

        manager.disconnect(
            websocket
        )


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message":
            "Smart E-Commerce Platform API is running"
    }