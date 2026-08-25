from django import forms
from django.contrib import admin
from django.core.files.storage import default_storage
from django.utils.html import format_html

from pathlib import Path
import uuid

from .models import (
    User,
    Product,
    Cart,
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

    image_upload = forms.ImageField(
        required=False,
        label="Product Image",
        help_text=(
            "Upload JPG, JPEG, PNG or WEBP image."
        ),
    )

    class Meta:
        model = Product

        fields = (
            "name",
            "description",
            "price",
            "stock",
            "image_upload",
        )

    def clean_image_upload(self):

        image = self.cleaned_data.get(
            "image_upload"
        )

        if not image:
            return image

        allowed_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
        }

        if image.content_type not in allowed_types:

            raise forms.ValidationError(
                "Only JPG, JPEG and WEBP images are allowed."
            )

        return image

    def save(
        self,
        commit=True,
    ):

        product = super().save(
            commit=False
        )

        image = self.cleaned_data.get(
            "image_upload"
        )

        # ----------------------------------------------------
        # UPLOAD NEW IMAGE
        # ----------------------------------------------------

        if image:

            extension = (
                Path(
                    image.name
                )
                .suffix
                .lower()
            )

            filename = (
                f"{uuid.uuid4().hex}"
                f"{extension}"
            )

            storage_path = (
                f"products/{filename}"
            )

            saved_path = (
                default_storage.save(
                    storage_path,
                    image,
                )
            )

            image_url = (
                default_storage.url(
                    saved_path
                )
            )

            # ------------------------------------------------
            # EXISTING IMAGES
            # ------------------------------------------------

            existing_images = (
                product.images
                if isinstance(
                    product.images,
                    list,
                )
                else []
            )

            existing_images.append(
                image_url
            )

            product.images = (
                existing_images
            )

        # ----------------------------------------------------
        # SAVE PRODUCT
        # ----------------------------------------------------

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
        "image_upload",
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

            return (
                "No images uploaded."
            )

        if not isinstance(
            obj.images,
            list,
        ):

            return (
                "No valid image data."
            )

        previews = []

        for image_value in obj.images:

            image_value = str(
                image_value
            )

            # ------------------------------------------------
            # SUPPORT OLD DATABASE VALUES
            #
            # Example:
            # tablet.jpg
            #
            # New uploads:
            # /media/products/abc123.jpg
            # ------------------------------------------------

            if image_value.startswith(
                (
                    "http://",
                    "https://",
                    "/",
                )
            ):

                image_url = (
                    image_value
                )

            else:

                image_url = (
                    f"/media/products/"
                    f"{image_value}"
                )

            previews.append(

                format_html(

                    '<div style="'
                    'margin:10px 0;'
                    'padding:10px;'
                    'border:1px solid #ddd;'
                    'border-radius:8px;'
                    'width:180px;'
                    'background:#fafafa;'
                    '">'

                    '<img src="{}" '
                    'style="'
                    'width:150px;'
                    'height:120px;'
                    'object-fit:contain;'
                    'display:block;'
                    'margin-bottom:8px;'
                    '" onerror="this.style.display=\'none\';">'
                    
                    '<div style="'
                    'font-size:12px;'
                    'word-break:break-all;'
                    'color:#555;'
                    '">'

                    '{}'

                    '</div>'

                    '</div>',

                    image_url,
                    image_value,
                )
            )

        return format_html(
            '<div style="'
            'display:flex;'
            'flex-wrap:wrap;'
            'gap:10px;'
            '">'
            '{}'
            '</div>',
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