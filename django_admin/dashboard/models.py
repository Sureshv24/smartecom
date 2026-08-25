from django.db import models


# ============================================================
# USER
# ============================================================

class User(models.Model):

    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("staff", "Staff"),
        ("customer", "Customer"),
    )

    id = models.AutoField(
        primary_key=True
    )

    name = models.CharField(
        max_length=100
    )

    email = models.EmailField(
        max_length=255,
        unique=True
    )

    password = models.CharField(
        max_length=255
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="customer",
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "users"

    def __str__(self):
        return f"{self.name} ({self.email})"


# ============================================================
# PRODUCT
# ============================================================

class Product(models.Model):

    id = models.AutoField(
        primary_key=True
    )

    name = models.CharField(
        max_length=200
    )

    description = models.TextField(
        blank=True,
        null=True
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    stock = models.IntegerField()

    images = models.JSONField(
        blank=True,
        null=True
    )

    class Meta:
        managed = False
        db_table = "products"

    def __str__(self):
        return self.name


# ============================================================
# CART
# ============================================================

class Cart(models.Model):

    id = models.AutoField(
        primary_key=True
    )

    user = models.ForeignKey(
        User,
        on_delete=models.DO_NOTHING,
        db_column="user_id",
        related_name="cart_items"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.DO_NOTHING,
        db_column="product_id",
        related_name="cart_items"
    )

    quantity = models.IntegerField()

    class Meta:
        managed = False
        db_table = "carts"

    def __str__(self):
        return (
            f"{self.user.name} - "
            f"{self.product.name} "
            f"(Qty: {self.quantity})"
        )