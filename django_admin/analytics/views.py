from django.db.models import (
    Sum,
    Count,
)
from django.db.models.functions import TruncDate
from django.shortcuts import render

from dashboard.models import (
    User,
    Product,
    Cart,
    Order,
    OrderItem,
)


def dashboard(request):

    # ========================================================
    # BASIC COUNTS
    # ========================================================

    total_users = User.objects.count()

    total_products = Product.objects.count()

    total_cart_items = Cart.objects.count()


    # ========================================================
    # USER ROLES
    # ========================================================

    admin_count = User.objects.filter(
        role="admin"
    ).count()

    staff_count = User.objects.filter(
        role="staff"
    ).count()

    customer_count = User.objects.filter(
        role="customer"
    ).count()


    # ========================================================
    # STOCK
    # ========================================================

    total_stock = sum(
        product.stock
        for product in Product.objects.all()
    )

    low_stock_products = Product.objects.filter(
        stock__lte=10
    ).order_by(
        "stock"
    )

    low_stock = low_stock_products.count()


    # ========================================================
    # PAID ORDERS
    # ========================================================

    paid_orders = Order.objects.filter(
        payment_status="paid"
    )


    # ========================================================
    # TOTAL SALES
    # ========================================================

    total_sales = paid_orders.count()


    # ========================================================
    # TOTAL REVENUE
    # ========================================================

    revenue_result = paid_orders.aggregate(
        total=Sum("total_amount")
    )

    total_revenue = (
        revenue_result["total"]
        or 0
    )


    # ========================================================
    # REVENUE TREND
    # ========================================================

    revenue_rows = (
        paid_orders
        .annotate(
            day=TruncDate("created_at")
        )
        .values("day")
        .annotate(
            revenue=Sum("total_amount")
        )
        .order_by("day")
    )

    revenue_labels = []

    revenue_values = []

    for row in revenue_rows:

        if row["day"]:

            revenue_labels.append(
                row["day"].strftime(
                    "%d %b"
                )
            )

            revenue_values.append(
                float(
                    row["revenue"]
                )
            )


    # ========================================================
    # TOP-SELLING PRODUCTS
    # ========================================================

    top_products = (
        OrderItem.objects
        .filter(
            order__payment_status="paid"
        )
        .values(
            "product_name"
        )
        .annotate(
            total_quantity=Sum(
                "quantity"
            )
        )
        .order_by(
            "-total_quantity"
        )[:5]
    )

    top_product_labels = []

    top_product_values = []

    for item in top_products:

        top_product_labels.append(
            item["product_name"]
        )

        top_product_values.append(
            item["total_quantity"]
        )


    # ========================================================
    # CONTEXT
    # ========================================================

    context = {

        # Basic
        "total_users": total_users,
        "total_products": total_products,
        "total_cart_items": total_cart_items,

        # Roles
        "admin_count": admin_count,
        "staff_count": staff_count,
        "customer_count": customer_count,

        # Stock
        "total_stock": total_stock,
        "low_stock": low_stock,
        "low_stock_products": low_stock_products,

        # Sales
        "total_sales": total_sales,
        "total_revenue": total_revenue,

        # Charts
        "revenue_labels": revenue_labels,
        "revenue_values": revenue_values,

        "top_product_labels": top_product_labels,
        "top_product_values": top_product_values,
    }

    return render(
        request,
        "analytics/dashboard.html",
        context
    )