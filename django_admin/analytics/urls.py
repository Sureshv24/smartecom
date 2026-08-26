from django.urls import path

from .views import dashboard

from .reports import (
    export_users_csv,
    export_orders_csv,
    export_sales_csv,
)

from .pdf_reports import (
    export_users_pdf,
    export_orders_pdf,
    export_sales_pdf,
)


urlpatterns = [

    # ============================================================
    # ANALYTICS DASHBOARD
    # ============================================================

    path(
        "",
        dashboard,
        name="analytics-dashboard",
    ),


    # ============================================================
    # CSV REPORTS
    # ============================================================

    path(
        "reports/users/csv/",
        export_users_csv,
        name="export-users-csv",
    ),

    path(
        "reports/orders/csv/",
        export_orders_csv,
        name="export-orders-csv",
    ),

    path(
        "reports/sales/csv/",
        export_sales_csv,
        name="export-sales-csv",
    ),


    # ============================================================
    # PDF REPORTS
    # ============================================================

    path(
        "reports/users/pdf/",
        export_users_pdf,
        name="export-users-pdf",
    ),

    path(
        "reports/orders/pdf/",
        export_orders_pdf,
        name="export-orders-pdf",
    ),

    path(
        "reports/sales/pdf/",
        export_sales_pdf,
        name="export-sales-pdf",
    ),
]