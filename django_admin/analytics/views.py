from django.shortcuts import render

from dashboard.models import User, Product, Cart


def dashboard(request):
    total_users = User.objects.count()
    total_products = Product.objects.count()
    total_cart_items = Cart.objects.count()

    admin_count = User.objects.filter(role="admin").count()
    staff_count = User.objects.filter(role="staff").count()
    customer_count = User.objects.filter(role="customer").count()

    total_stock = sum(
        product.stock for product in Product.objects.all()
    )

    low_stock = Product.objects.filter(stock__lte=10).count()

    context = {
        "total_users": total_users,
        "total_products": total_products,
        "total_cart_items": total_cart_items,
        "admin_count": admin_count,
        "staff_count": staff_count,
        "customer_count": customer_count,
        "total_stock": total_stock,
        "low_stock": low_stock,
    }

    return render(
        request,
        "analytics/dashboard.html",
        context
    )