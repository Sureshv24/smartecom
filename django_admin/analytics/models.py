from django.db import models


# ============================================================
# ANALYTICS MODELS
# ============================================================
#
# Analytics does not require separate database tables.
#
# The analytics dashboard reads existing data from:
#
# dashboard.models.User
# dashboard.models.Product
# dashboard.models.Cart
# dashboard.models.Order
# dashboard.models.OrderItem
#
# Therefore, this file intentionally contains no models.
# ============================================================