from io import BytesIO

from django.http import HttpResponse

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from dashboard.models import (
    User,
    Order,
)


# ============================================================
# COMMON PDF RESPONSE
# ============================================================

def create_pdf_response(
    filename,
    title,
    headers,
    rows,
):

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30,
    )

    styles = getSampleStyleSheet()

    elements = []

    # --------------------------------------------------------
    # TITLE
    # --------------------------------------------------------

    elements.append(
        Paragraph(
            title,
            styles["Title"],
        )
    )

    elements.append(
        Spacer(
            1,
            20,
        )
    )

    # --------------------------------------------------------
    # TABLE
    # --------------------------------------------------------

    data = [
        headers
    ] + rows

    table = Table(
        data,
        repeatRows=1,
    )

    table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.HexColor(
                        "#2563eb"
                    ),
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.white,
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (-1, 0),
                    "Helvetica-Bold",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "TOP",
                ),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [
                        colors.white,
                        colors.HexColor(
                            "#f8fafc"
                        ),
                    ],
                ),
                (
                    "LEFTPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "RIGHTPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "TOPPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, -1),
                    6,
                ),
            ]
        )
    )

    elements.append(table)

    # --------------------------------------------------------
    # BUILD PDF
    # --------------------------------------------------------

    document.build(elements)

    buffer.seek(0)

    response = HttpResponse(
        buffer.getvalue(),
        content_type="application/pdf",
    )

    response[
        "Content-Disposition"
    ] = (
        f'attachment; filename="{filename}"'
    )

    return response


# ============================================================
# USERS PDF
# ============================================================

def export_users_pdf(request):

    rows = []

    users = (
        User.objects
        .all()
        .order_by("id")
    )

    for user in users:

        rows.append(
            [
                str(user.id),
                user.name,
                user.email,
                user.role,
                (
                    "Yes"
                    if user.is_active
                    else "No"
                ),
                str(user.created_at),
            ]
        )

    return create_pdf_response(
        filename="users_report.pdf",
        title="User Report",
        headers=[
            "ID",
            "Name",
            "Email",
            "Role",
            "Active",
            "Created At",
        ],
        rows=rows,
    )


# ============================================================
# ORDERS PDF
# ============================================================

def export_orders_pdf(request):

    rows = []

    orders = (
        Order.objects
        .select_related("user")
        .all()
        .order_by("-created_at")
    )

    for order in orders:

        rows.append(
            [
                str(order.id),
                order.user.name,
                order.user.email,
                str(order.total_amount),
                order.payment_status,
                order.order_status,
                str(order.created_at),
            ]
        )

    return create_pdf_response(
        filename="orders_report.pdf",
        title="Orders Report",
        headers=[
            "Order ID",
            "User",
            "Email",
            "Amount",
            "Payment",
            "Order Status",
            "Created At",
        ],
        rows=rows,
    )


# ============================================================
# SALES PDF
# ============================================================

def export_sales_pdf(request):

    rows = []

    paid_orders = (
        Order.objects
        .filter(
            payment_status="paid"
        )
        .select_related("user")
        .order_by("-created_at")
    )

    for order in paid_orders:

        rows.append(
            [
                str(order.id),
                order.user.name,
                str(order.total_amount),
                order.payment_status,
                order.order_status,
                str(order.created_at),
            ]
        )

    return create_pdf_response(
        filename="sales_report.pdf",
        title="Sales Report",
        headers=[
            "Order ID",
            "User",
            "Amount",
            "Payment",
            "Order Status",
            "Date",
        ],
        rows=rows,
    )