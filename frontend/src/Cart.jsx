import { useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";


// ============================================================
// ONLINE PRODUCT IMAGES
// ============================================================

const ONLINE_PRODUCT_IMAGES = {
  "smart watch":
    "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTEwL3JtNTUxLTM3LWFwcGxld2F0Y2gtMzctYl8xLnBuZw.png",

  "wireless headphones":
    "https://images.rawpixel.com/image_png_social_square/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI0LTA3L3Jhd3BpeGVsX29mZmljZV8zNF9jbG9zZXVwX3Byb2R1Y3RfcGhvdG9ncmFwaHlfb2ZfYV93aGl0ZV9ibGFua18zY2MwOWUzYy00ZjdkLTQzMTQtOWYwMi1kY2EzOTgzZjBkOGEucG5n.png",
};


const FALLBACK_IMAGE =
  ONLINE_PRODUCT_IMAGES["smart watch"];


// ============================================================
// PRODUCT IMAGE
// ============================================================

const getProductImage = (product) => {
  const productName = (
    product?.name || ""
  )
    .trim()
    .toLowerCase();

  if (ONLINE_PRODUCT_IMAGES[productName]) {
    return ONLINE_PRODUCT_IMAGES[productName];
  }

  if (
    typeof product?.images === "string" &&
    (
      product.images.startsWith("http://") ||
      product.images.startsWith("https://")
    )
  ) {
    return product.images;
  }

  if (Array.isArray(product?.images)) {
    const image = product.images[0];

    if (
      image &&
      (
        image.startsWith("http://") ||
        image.startsWith("https://")
      )
    ) {
      return image;
    }
  }

  if (typeof product?.images === "string") {
    const imageName =
      product.images.trim().toLowerCase();

    if (
      imageName === "headphones.jpg" ||
      imageName === "headphone.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "wireless headphones"
      ];
    }

    if (
      imageName === "smart-watch.jpg" ||
      imageName === "smartwatch.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "smart watch"
      ];
    }
  }

  return FALLBACK_IMAGE;
};


// ============================================================
// CART
// ============================================================

function Cart({ onBack, onCheckout }) {

  const [cartItems, setCartItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // Backend cart calculation
  const [cartSummary, setCartSummary] =
    useState({
      subtotal: 0,
      tax: 0,
      grand_total: 0,
    });


  const token =
    localStorage.getItem(
      "access_token"
    );


  // ============================================================
  // LOAD CART
  // ============================================================

  const loadCart = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        throw new Error(
          "Please login again."
        );
      }

      const data =
        await api.getCart(token);


      // --------------------------------------------------------
      // NEW BACKEND RESPONSE
      // --------------------------------------------------------

      if (
        data &&
        Array.isArray(data.items)
      ) {
        setCartItems(
          data.items
        );

        setCartSummary({
          subtotal:
            Number(
              data.subtotal || 0
            ),

          tax:
            Number(
              data.tax || 0
            ),

          grand_total:
            Number(
              data.grand_total || 0
            ),
        });

      }

      // --------------------------------------------------------
      // OLD ARRAY RESPONSE SUPPORT
      // --------------------------------------------------------

      else if (
        Array.isArray(data)
      ) {
        setCartItems(data);

        // Calculate fallback values
        const subtotal =
          data.reduce(
            (sum, item) => {
              const price =
                Number(
                  item.product?.price ||
                    0
                );

              const quantity =
                Number(
                  item.quantity || 0
                );

              return (
                sum +
                price *
                  quantity
              );
            },
            0
          );

        const tax =
          subtotal * 0.05;

        setCartSummary({
          subtotal,
          tax,
          grand_total:
            subtotal + tax,
        });
      }

      else {
        setCartItems([]);

        setCartSummary({
          subtotal: 0,
          tax: 0,
          grand_total: 0,
        });
      }

    } catch (error) {

      console.error(
        "Load cart error:",
        error
      );

      setError(
        error.message ||
          "Unable to load cart"
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadCart();
  }, []);


  // ============================================================
  // INCREASE QUANTITY
  // ============================================================

  const increaseQuantity = async (
    item
  ) => {
    try {
      setError("");

      await api.updateCart(
        item.id,
        Number(item.quantity) + 1,
        token
      );

      // Reload backend calculations
      await loadCart();

    } catch (error) {

      console.error(
        "Increase quantity error:",
        error
      );

      setError(
        error.message ||
          "Unable to update quantity"
      );
    }
  };


  // ============================================================
  // DECREASE QUANTITY
  // ============================================================

  const decreaseQuantity = async (
    item
  ) => {

    const quantity =
      Number(item.quantity);

    if (quantity <= 1) {
      return;
    }

    try {
      setError("");

      await api.updateCart(
        item.id,
        quantity - 1,
        token
      );

      // Reload backend calculations
      await loadCart();

    } catch (error) {

      console.error(
        "Decrease quantity error:",
        error
      );

      setError(
        error.message ||
          "Unable to update quantity"
      );
    }
  };


  // ============================================================
  // REMOVE ITEM
  // ============================================================

  const removeItem = async (
    cartId
  ) => {
    try {
      setError("");

      await api.deleteCart(
        cartId,
        token
      );

      // Reload backend calculations
      await loadCart();

    } catch (error) {

      console.error(
        "Remove cart error:",
        error
      );

      setError(
        error.message ||
          "Unable to remove item"
      );
    }
  };


  // ============================================================
  // TOTAL QUANTITY
  // ============================================================

  const totalQuantity =
    cartItems.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-loading">
          Loading your cart...
        </div>
      </div>
    );
  }


  // ============================================================
  // MAIN UI
  // ============================================================

  return (
    <div className="cart-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="cart-header">

        <button
          type="button"
          className="back-btn"
          onClick={onBack}
        >
          ← Continue Shopping
        </button>

        <h1>
          🛒 My Cart
        </h1>

        <p>
          {totalQuantity}{" "}
          {totalQuantity === 1
            ? "item"
            : "items"}
        </p>

      </div>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}


      {/* ======================================================
          EMPTY CART
      ====================================================== */}

      {cartItems.length === 0 ? (

        <div className="empty-cart">

          <div className="empty-cart-icon">
            🛒
          </div>

          <h2>
            Your cart is empty
          </h2>

          <p>
            Add some products to
            your cart.
          </p>

          <button
            type="button"
            className="shop-btn"
            onClick={onBack}
          >
            Start Shopping
          </button>

        </div>

      ) : (

        <div className="cart-layout">

          {/* ==================================================
              CART ITEMS
          ================================================== */}

          <div className="cart-items">

            {cartItems.map(
              (item) => {

                const product =
                  item.product;

                const price =
                  Number(
                    product?.price ||
                      0
                  );

                const quantity =
                  Number(
                    item.quantity ||
                      0
                  );

                const itemTotal =
                  Number(
                    item.item_total ||
                      price * quantity
                  );

                const productImage =
                  getProductImage(
                    product
                  );


                return (
                  <div
                    className="cart-item"
                    key={item.id}
                  >

                    {/* PRODUCT IMAGE */}

                    <div className="cart-product-image">

                      <img
                        src={
                          productImage
                        }
                        alt={
                          product?.name ||
                          "Product"
                        }
                        loading="lazy"
                        onError={(
                          event
                        ) => {

                          if (
                            event
                              .currentTarget
                              .src !==
                            FALLBACK_IMAGE
                          ) {
                            event
                              .currentTarget
                              .src =
                              FALLBACK_IMAGE;
                          }

                        }}
                      />

                    </div>


                    {/* PRODUCT DETAILS */}

                    <div className="cart-product-info">

                      <h2>
                        {product?.name ||
                          "Product"}
                      </h2>

                      <p>
                        {product?.description ||
                          "No description available"}
                      </p>

                      <strong>
                        ₹
                        {price.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                    </div>


                    {/* QUANTITY */}

                    <div className="quantity-control">

                      <button
                        type="button"
                        onClick={() =>
                          decreaseQuantity(
                            item
                          )
                        }
                        disabled={
                          quantity <= 1
                        }
                      >
                        −
                      </button>

                      <span>
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          increaseQuantity(
                            item
                          )
                        }
                      >
                        +
                      </button>

                    </div>


                    {/* ITEM TOTAL */}

                    <div className="cart-subtotal">
                      ₹
                      {itemTotal.toLocaleString(
                        "en-IN"
                      )}
                    </div>


                    {/* REMOVE */}

                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() =>
                        removeItem(
                          item.id
                        )
                      }
                    >
                      🗑 Remove
                    </button>

                  </div>
                );
              }
            )}

          </div>


          {/* ==================================================
              ORDER SUMMARY
          ================================================== */}

          <div className="cart-summary">

            <h2>
              Order Summary
            </h2>


            {/* ITEMS */}

            <div className="summary-row">

              <span>
                Items
              </span>

              <span>
                {totalQuantity}
              </span>

            </div>


            {/* SUBTOTAL */}

            <div className="summary-row">

              <span>
                Subtotal
              </span>

              <span>
                ₹
                {cartSummary.subtotal.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </span>

            </div>


            {/* TAX */}

            <div className="summary-row">

              <span>
                Tax (5%)
              </span>

              <span>
                ₹
                {cartSummary.tax.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </span>

            </div>


            {/* DELIVERY */}

            <div className="summary-row">

              <span>
                Delivery
              </span>

              <span>
                FREE
              </span>

            </div>


            <hr />


            {/* GRAND TOTAL */}

            <div className="total-row">

              <span>
                Grand Total
              </span>

              <span>
                ₹
                {cartSummary.grand_total.toLocaleString(
                  "en-IN",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}
              </span>

            </div>


            {/* CHECKOUT */}

            <button
              type="button"
              className="checkout-btn"
              onClick={() => {

                if (
                  cartItems.length === 0
                ) {
                  setError(
                    "Your cart is empty."
                  );
                  return;
                }

                if (!token) {
                  setError(
                    "Your session has expired. Please login again."
                  );
                  return;
                }

                onCheckout();

              }}
            >
              Proceed to Checkout
            </button>

          </div>

        </div>
      )}

    </div>
  );
}


export default Cart;