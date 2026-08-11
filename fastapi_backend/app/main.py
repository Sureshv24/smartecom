from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware

from app.db.database import engine, Base
from app.db import models
from app.auth.router import router as auth_router
from app.products.router import router as product_router
from app.cart.router import router as cart_router
from app.core.config import JWT_SECRET_KEY


# Create database tables
Base.metadata.create_all(bind=engine)


# Create FastAPI application
app = FastAPI(
    title="Smart E-Commerce Platform API",
    version="1.0.0"
)


# Session middleware for Auth0 OAuth
app.add_middleware(
    SessionMiddleware,
    secret_key=JWT_SECRET_KEY
)


# Authentication routes
app.include_router(auth_router)
app.include_router(product_router)
app.include_router(cart_router)


@app.get("/")
def root():
    return {
        "message": "Smart E-Commerce Platform API is running"
    }