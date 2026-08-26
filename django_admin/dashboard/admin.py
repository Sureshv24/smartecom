from django import forms
from django.contrib import admin
from django.utils.html import format_html

from .models import (
    User,
    Product,
    Cart,
    Order,
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