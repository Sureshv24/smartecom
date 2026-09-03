from django import forms
from django.contrib import admin
from django.urls import path
from django.utils.html import format_html
import requests
from django.conf import settings

from django.contrib import messages
from django.shortcuts import redirect
from django.urls import path, reverse

from .models import (
    User,
    Product,
    Cart,
    Order,
    ReturnRequest
)


# ============================================================
# USER ADMIN
# ============================================================

@admin.register(User)
class UserAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "name",
        "email",
        "role",
        "is_active",
        "created_at",
    )

    list_filter = (
        "role",
        "is_active",
    )

    search_fields = (
        "name",
        "email",
    )

    ordering = (
        "-created_at",
    )

    list_editable = (
        "role",
        "is_active",
    )

    fields = (
        "name",
        "email",
        "password",
        "role",
        "is_active",
        "created_at",
    )

    readonly_fields = (
        "created_at",
    )


# ============================================================
# PRODUCT FORM
# ============================================================

class ProductAdminForm(forms.ModelForm):

    image_url = forms.URLField(
        required=False,
        label="Product Image URL",
        help_text=(
            "Paste a direct JPG, PNG or WEBP image URL."
        ),
    )

    class Meta:
        model = Product

        fields = (
            "name",
            "description",
            "price",
            "stock",
            "image_url",
        )

    def save(
        self,
        commit=True,
    ):

        product = super().save(
            commit=False
        )

        image_url = (
            self.cleaned_data.get(
                "image_url"
            )
        )

        # ----------------------------------------------------
        # SAVE IMAGE URL
        # ----------------------------------------------------

        if image_url:

            existing_images = (
                product.images
                if isinstance(
                    product.images,
                    list,
                )
                else []
            )

            # Keep existing URLs
            existing_images.append(
                image_url
            )

            product.images = (
                existing_images
            )

        if commit:
            product.save()

        return product


# ============================================================
# PRODUCT ADMIN
# ============================================================

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):

    form = ProductAdminForm

    list_display = (
        "id",
        "name",
        "price",
        "stock",
        "image_count",
    )

    search_fields = (
        "name",
    )

    list_filter = (
        "stock",
    )

    fields = (
        "name",
        "description",
        "price",
        "stock",
        "image_url",
        "image_preview",
    )

    readonly_fields = (
        "image_preview",
    )

    # --------------------------------------------------------
    # IMAGE COUNT
    # --------------------------------------------------------

    @admin.display(
        description="Images"
    )
    def image_count(
        self,
        obj,
    ):

        if not isinstance(
            obj.images,
            list,
        ):
            return 0

        return len(
            obj.images
        )

    # --------------------------------------------------------
    # IMAGE PREVIEW
    # --------------------------------------------------------

    @admin.display(
        description="Current Images"
    )
    def image_preview(
        self,
        obj,
    ):

        if not obj.images:
            return "No images uploaded."

        if not isinstance(
            obj.images,
            list,
        ):
            return "No valid image data."

        previews = []

        for image_url in obj.images:

            image_url = str(
                image_url
            ).strip()

            if not image_url:
                continue

            previews.append(
                format_html(
                    """
                    <div style="
                        display:inline-block;
                        vertical-align:top;
                        margin:10px;
                        padding:10px;
                        width:200px;
                        border:1px solid #ddd;
                        border-radius:8px;
                        background:#fafafa;
                        text-align:center;
                    ">
                        <img
                            src="{}"
                            alt="Product image"
                            style="
                                width:180px;
                                height:140px;
                                object-fit:contain;
                                display:block;
                                margin:0 auto 8px auto;
                                border-radius:6px;
                            "
                        >
                        <div style="
                            font-size:11px;
                            color:#555;
                            word-break:break-all;
                        ">
                            {}
                        </div>
                    </div>
                    """,
                    image_url,
                    image_url,
                )
            )

        if not previews:
            return "No valid images."

        return format_html(
            '<div style="display:flex;flex-wrap:wrap;">{}</div>',
            "".join(
                str(item)
                for item in previews
            ),
        )


# ============================================================
# CART ADMIN
# ============================================================

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "product",
        "quantity",
    )

    search_fields = (
        "user__name",
        "user__email",
        "product__name",
    )
    # ============================================================
# ORDER ADMIN
# ============================================================

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "total_amount",
        "payment_status",
        "order_status",
        "created_at",
    )

    list_filter = (
        "payment_status",
        "order_status",
        "created_at",
    )

    search_fields = (
        "id",
        "user__name",
        "user__email",
    )

    ordering = (
        "-created_at",
    )

    list_editable = (
        "payment_status",
        "order_status",
    )

    fields = (
        "user",
        "total_amount",
        "payment_status",
        "order_status",
        "created_at",
    )

    readonly_fields = (
        "user",
        "total_amount",
        "created_at",
    )
   # ============================================================
# RETURN REQUEST ADMIN
# ============================================================

@admin.register(ReturnRequest)
class ReturnRequestAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "order",
        "user",
        "reason",
        "status",
        "created_at",
        "action_buttons",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "id",
        "reason",
        "comment",
        "order__id",
        "user__name",
        "user__email",
    )

    readonly_fields = (
        "id",
        "order",
        "user",
        "reason",
        "comment",
        "created_at",
    )

    ordering = (
        "-created_at",
    )

    # ========================================================
    # CUSTOM ADMIN URLS
    # ========================================================

    def get_urls(self):
        urls = super().get_urls()

        custom_urls = [
            path(
                "<int:return_id>/approve/",
                self.admin_site.admin_view(self.approve_return),
                name="dashboard_returnrequest_approve",
            ),
            path(
                "<int:return_id>/reject/",
                self.admin_site.admin_view(self.reject_return),
                name="dashboard_returnrequest_reject",
            ),
        ]

        return custom_urls + urls

    # ========================================================
    # APPROVE RETURN
    # ========================================================

    def approve_return(self, request, return_id):
        url = (
            f"{settings.FASTAPI_BASE_URL}"
            f"/admin/internal/returns/{return_id}/approve"
        )

        try:
            response = requests.post(
                url,
                headers={
                    "X-Internal-Admin-Token": settings.INTERNAL_ADMIN_TOKEN,
                },
                timeout=30,
            )

            if response.ok:
                data = response.json()
                self.message_user(
                    request,
                    data.get(
                        "message",
                        f"Return #{return_id} approved successfully.",
                    ),
                    level=messages.SUCCESS,
                )
            else:
                try:
                    error_data = response.json()
                    detail = error_data.get(
                        "detail",
                        "Failed to approve return.",
                    )
                except ValueError:
                    detail = "Failed to approve return."

                self.message_user(
                    request,
                    detail,
                    level=messages.ERROR,
                )

        except requests.RequestException as exc:
            self.message_user(
                request,
                f"FastAPI connection failed: {exc}",
                level=messages.ERROR,
            )

        return redirect(
            reverse("admin:dashboard_returnrequest_changelist")
        )

    # ========================================================
    # REJECT RETURN
    # ========================================================

    def reject_return(self, request, return_id):
        url = (
            f"{settings.FASTAPI_BASE_URL}"
            f"/admin/internal/returns/{return_id}/reject"
        )

        try:
            response = requests.post(
                url,
                headers={
                    "X-Internal-Admin-Token": settings.INTERNAL_ADMIN_TOKEN,
                },
                timeout=30,
            )

            if response.ok:
                data = response.json()
                self.message_user(
                    request,
                    data.get(
                        "message",
                        f"Return #{return_id} rejected successfully.",
                    ),
                    level=messages.SUCCESS,
                )
            else:
                try:
                    error_data = response.json()
                    detail = error_data.get(
                        "detail",
                        "Failed to reject return.",
                    )
                except ValueError:
                    detail = "Failed to reject return."

                self.message_user(
                    request,
                    detail,
                    level=messages.ERROR,
                )

        except requests.RequestException as exc:
            self.message_user(
                request,
                f"FastAPI connection failed: {exc}",
                level=messages.ERROR,
            )

        return redirect(
            reverse("admin:dashboard_returnrequest_changelist")
        )

    # ========================================================
    # ACTION BUTTONS
    # ========================================================

    @admin.display(description="Actions")
    def action_buttons(self, obj):
        if obj.status == "pending":
            approve_url = reverse(
                "admin:dashboard_returnrequest_approve",
                args=[obj.pk],
            )

            reject_url = reverse(
                "admin:dashboard_returnrequest_reject",
                args=[obj.pk],
            )

            return format_html(
                '<a class="button" href="{}" '
                'style="background:#28a745;color:white;'
                'padding:5px 10px;border-radius:4px;'
                'text-decoration:none;margin-right:5px;">'
                'Approve</a>'
                '<a class="button" href="{}" '
                'style="background:#dc3545;color:white;'
                'padding:5px 10px;border-radius:4px;'
                'text-decoration:none;">'
                'Reject</a>',
                approve_url,
                reject_url,
            )

        return format_html(
            '<span style="color:#777;">No actions</span>'
        )