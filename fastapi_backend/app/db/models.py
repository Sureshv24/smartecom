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
    UniqueConstraint,
)

from sqlalchemy.orm import relationship

from app.db.database import Base


# ============================================================
# USER
# ============================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(100),
        nullable=False,
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password = Column(
        String(255),
        nullable=False,
    )

    role = Column(
        Enum(
            "admin",
            "staff",
            "customer",
        ),
        default="customer",
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )


# ============================================================
# PRODUCT
# ============================================================

class Product(Base):
    __tablename__ = "products"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(200),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    category = Column(
        String(100),
        nullable=False,
        default="General",
        index=True,
    )

    price = Column(
        DECIMAL(10, 2),
        nullable=False,
    )

    stock = Column(
        Integer,
        default=0,
        nullable=False,
    )

    popularity = Column(
        Integer,
        default=0,
        nullable=False,
        index=True,
    )

    images = Column(
        JSON,
        nullable=True,
    )

    # --------------------------------------------------------
    # Relationship with OrderItem
    # --------------------------------------------------------

    order_items = relationship(
        "OrderItem",
        back_populates="product",
    )


# ============================================================
# CART
# ============================================================

class Cart(Base):
    __tablename__ = "carts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False,
    )

    quantity = Column(
        Integer,
        default=1,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "product_id",
            name="unique_user_product",
        ),
    )


# ============================================================
# ORDER
# ============================================================

class Order(Base):
    __tablename__ = "orders"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # --------------------------------------------------------
    # Total amount including tax
    # --------------------------------------------------------

    total_amount = Column(
        DECIMAL(10, 2),
        nullable=False,
    )

    # --------------------------------------------------------
    # Payment status
    # --------------------------------------------------------
    # pending
    # paid
    # failed
    # refunded
    # --------------------------------------------------------

    payment_status = Column(
        String(30),
        nullable=False,
        default="pending",
    )

    # --------------------------------------------------------
    # Order status
    # --------------------------------------------------------
    # pending
    # paid
    # shipped
    # delivered
    # cancelled
    # --------------------------------------------------------

    order_status = Column(
        String(30),
        nullable=False,
        default="pending",
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    # --------------------------------------------------------
    # User relationship
    # --------------------------------------------------------

    user = relationship(
        "User",
        backref="orders",
    )

    # --------------------------------------------------------
    # Order items relationship
    # --------------------------------------------------------

    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
    )

    # --------------------------------------------------------
    # Payment relationship
    # --------------------------------------------------------

    payment = relationship(
        "Payment",
        back_populates="order",
        uselist=False,
        cascade="all, delete-orphan",
    )


# ============================================================
# ORDER ITEM
# ============================================================

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False,
        index=True,
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False,
    )

    product_name = Column(
        String(200),
        nullable=False,
    )

    quantity = Column(
        Integer,
        nullable=False,
    )

    price = Column(
        DECIMAL(10, 2),
        nullable=False,
    )

    subtotal = Column(
        DECIMAL(10, 2),
        nullable=False,
    )

    # --------------------------------------------------------
    # Order relationship
    # --------------------------------------------------------

    order = relationship(
        "Order",
        back_populates="items",
    )

    # --------------------------------------------------------
    # Product relationship
    # --------------------------------------------------------

    product = relationship(
        "Product",
        back_populates="order_items",
    )


# ============================================================
# PAYMENT
# ============================================================

class Payment(Base):
    __tablename__ = "payments"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True,
    )

    # --------------------------------------------------------
    # Order reference
    # --------------------------------------------------------

    order_id = Column(
        Integer,
        ForeignKey("orders.id"),
        nullable=False,
        unique=True,
        index=True,
    )

    # --------------------------------------------------------
    # Payment amount
    # --------------------------------------------------------

    amount = Column(
        DECIMAL(10, 2),
        nullable=False,
    )

    # --------------------------------------------------------
    # Payment method
    # --------------------------------------------------------

    payment_method = Column(
        String(50),
        nullable=False,
        default="stripe",
    )

    # --------------------------------------------------------
    # Stripe transaction/session/payment ID
    # --------------------------------------------------------

    transaction_id = Column(
        String(255),
        nullable=True,
        unique=True,
    )

    # --------------------------------------------------------
    # Payment status
    # --------------------------------------------------------
    # pending
    # paid
    # failed
    # refunded
    # --------------------------------------------------------

    status = Column(
        String(30),
        nullable=False,
        default="pending",
    )

    # --------------------------------------------------------
    # Timestamp
    # --------------------------------------------------------

    timestamp = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    # --------------------------------------------------------
    # Order relationship
    # --------------------------------------------------------

    order = relationship(
        "Order",
        back_populates="payment",
    )