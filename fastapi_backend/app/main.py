from dotenv import load_dotenv

load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.db.database import engine, Base
from app.db import models

from app.auth.router import router as auth_router
from app.products.router import router as product_router
from app.cart.router import router as cart_router
from app.orders.router import router as order_router
from app.checkout.router import router as checkout_router

from app.core.config import JWT_SECRET_KEY


# ============================================================
# CREATE DATABASE TABLES
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# CREATE FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Smart E-Commerce Platform API",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# SESSION MIDDLEWARE FOR AUTH0
# ============================================================

app.add_middleware(
    SessionMiddleware,
    secret_key=JWT_SECRET_KEY
)


# ============================================================
# ROUTES
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

# ------------------------------------------------------------
# CHECKOUT ROUTER
# POST /checkout
# ------------------------------------------------------------

app.include_router(
    checkout_router
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