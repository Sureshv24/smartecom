from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DECIMAL,
    ForeignKey,
    DateTime,
    JSON,
    Enum,
    UniqueConstraint
)

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)

    role = Column(
        Enum("admin", "staff", "customer"),
        default="customer",
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(DECIMAL(10, 2), nullable=False)
    stock = Column(Integer, default=0, nullable=False)
    images = Column(JSON, nullable=True)


class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )

    quantity = Column(
        Integer,
        default=1,
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "product_id",
            name="unique_user_product"
        ),
    )