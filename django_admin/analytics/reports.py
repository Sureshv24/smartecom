import csv

from django.http import HttpResponse

from dashboard.models import (
    User,
    Order,
)


# ============================================================
# USERS CSV
# ============================================================

def export_users_csv(request):

    response = HttpResponse(
        content_type="text/csv"
    )

    response["Content-Disposition"] = (
        'attachment; filename="users_report.csv"'
    )

    writer = csv.writer(response)

    writer.writerow([
        "ID",
        "Name",
        "Email",
        "Role",
        "Active",
        "Created At",
    ])

    users = User.objects.all().order_by("id")

    for user in users:

        writer.writerow([
            user.id,
            user.name,
            user.email,
            user.role,
            "Yes" if user.is_active else "No",
            user.created_at,
        ])

    return response


# ============================================================
# ORDERS CSV
# ============================================================

def export_orders_csv(request):

    response = HttpResponse(
        content_type="text/csv"
    )

    response["Content-Disposition"] = (
        'attachment; filename="orders_report.csv"'
    )

    writer = csv.writer(response)

    writer.writerow([
        "Order ID",
        "User",
        "Email",
        "Total Amount",
        "Payment Status",
        "Order Status",
        "Created At",
    ])

    orders = (
        Order.objects
        .select_related("user")
        .all()
        .order_by("-created_at")
    )

    for order in orders:

        writer.writerow([
            order.id,
            order.user.name,
            order.user.email,
            order.total_amount,
            order.payment_status,
            order.order_status,
            order.created_at,
        ])

    return response


# ============================================================
# SALES CSV
# ============================================================

def export_sales_csv(request):

    response = HttpResponse(
        content_type="text/csv"
    )

    response["Content-Disposition"] = (
        'attachment; filename="sales_report.csv"'
    )

    writer = csv.writer(response)

    writer.writerow([
        "Order ID",
        "User",
        "Amount",
        "Payment Status",
        "Order Status",
        "Order Date",
    ])

    paid_orders = (
        Order.objects
        .filter(
            payment_status="paid"
        )
        .select_related("user")
        .order_by("-created_at")
    )

    for order in paid_orders:

        writer.writerow([
            order.id,
            order.user.name,
            order.total_amount,
            order.payment_status,
            order.order_status,
            order.created_at,
        ])

    return response