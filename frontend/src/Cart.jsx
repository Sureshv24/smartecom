import { useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";

// ============================================================
// ONLINE PRODUCT IMAGES - ALL 10 PRODUCTS
// ============================================================

const ONLINE_PRODUCT_IMAGES = {
  "smart watch":
    "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTEwL3JtNTUxLTM3LWFwcGxld2F0Y2gtMzctYl8xLnBuZw.png",

  "wireless headphones":
    "https://images.rawpixel.com/image_png_social_square/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI0LTA3L3Jhd3BpeGVsX29mZmljZV8zNF9jbG9zZXVwX3Byb2R1Y3RfcGhvdG9ncmFwaHlfb2ZfYV93aGl0ZV9ibGFua18zY2MwOWUzYy00ZjdkLTQzMTQtOWYwMi1kY2EzOTgzZjBkOGEucG5n.png",

  "bluetooth speaker":
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",

  smartphone:
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",

  laptop:
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",

  "mechanical keyboard":
    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",

  "wireless mouse":
    "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=800&q=80",

  "fitness band":
    "https://images.unsplash.com/photo-1576243345690-4e4b79b63288?auto=format&fit=crop&w=800&q=80",

  "gaming headset":
    "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=800&q=80",

  tablet:
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",
};


// ============================================================
// PRODUCT PLACEHOLDERS
// Used only if online image itself fails
// ============================================================

const PRODUCT_PLACEHOLDERS = {
  "smart watch": "⌚",
  "wireless headphones": "🎧",
  "bluetooth speaker": "🔊",
  smartphone: "📱",
  laptop: "💻",
  "mechanical keyboard": "⌨️",
  "wireless mouse": "🖱️",
  "fitness band": "⌚",
  "gaming headset": "🎧",
  tablet: "📱",
};


// ============================================================
// GET PRODUCT IMAGE
// ============================================================

const getProductImage = (product) => {
  const productName = (
    product?.name || ""
  )
    .trim()
    .toLowerCase();

  return (
    ONLINE_PRODUCT_IMAGES[productName] ||
    null
  );
};


// ============================================================
// GET PLACEHOLDER
// ============================================================

const getProductPlaceholder = (product) => {
  const productName = (
    product?.name || ""
  )
    .trim()
    .toLowerCase();

  return (
    PRODUCT_PLACEHOLDERS[productName] ||
    "🛍️"
  );
};


// ============================================================
// CART COMPONENT
// ============================================================

function Cart({ onBack }) {

  const [cartItems, setCartItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [checkoutLoading, setCheckoutLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==========================================================
  // LOAD CART
  // ==========================================================

  const loadCart = async () => {
    try {

      setLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        throw new Error(
          "Please login again."
        );
      }

      const data =
        await api.getCart(token);

      if (Array.isArray(data)) {

        setCartItems(data);

      } else if (
        Array.isArray(data?.items)
      ) {

        setCartItems(
          data.items
        );

      } else {

        setCartItems([]);

      }

    } catch (error) {

      console.error(
        "Load cart error:",
        error
      );

      setError(
        error.message ||
        "Unable to load cart."
      );

    } finally {

      setLoading(false);

    }
  };


  // ==========================================================
  // LOAD CART
  // ==========================================================

  useEffect(() => {
    loadCart();
  }, []);


  // ==========================================================
  // INCREASE QUANTITY
  // ==========================================================

  const increaseQuantity = async (item) => {

    try {

      setError("");

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        throw new Error(
          "Please login again."
        );
      }

      const updatedItem =
        await api.updateCart(
          item.id,
          Number(item.quantity) + 1,
          token
        );

      setCartItems((current) =>
        current.map((cartItem) =>
          cartItem.id === item.id
            ? updatedItem
            : cartItem
        )
      );

    } catch (error) {

      console.error(
        "Increase quantity error:",
        error
      );

      setError(
        error.message ||
        "Unable to update quantity."
      );

    }
  };


  // ==========================================================
  // DECREASE QUANTITY
  // ==========================================================

  const decreaseQuantity = async (item) => {

    const quantity =
      Number(item.quantity);

    if (quantity <= 1) {
      return;
    }

    try {

      setError("");

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        throw new Error(
          "Please login again."
        );
      }

      const updatedItem =
        await api.updateCart(
          item.id,
          quantity - 1,
          token
        );

      setCartItems((current) =>
        current.map((cartItem) =>
          cartItem.id === item.id
            ? updatedItem
            : cartItem
        )
      );

    } catch (error) {

      console.error(
        "Decrease quantity error:",
        error
      );

      setError(
        error.message ||
        "Unable to update quantity."
      );

    }
  };


  // ==========================================================
  // REMOVE ITEM
  // ==========================================================

  const removeItem = async (cartId) => {

    try {

      setError("");

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        throw new Error(
          "Please login again."
        );
      }

      await api.deleteCart(
        cartId,
        token
      );

      setCartItems((current) =>
        current.filter(
          (item) =>
            item.id !== cartId
        )
      );

    } catch (error) {

      console.error(
        "Remove cart error:",
        error
      );

      setError(
        error.message ||
        "Unable to remove item."
      );

    }
  };


  // ==========================================================
  // STRIPE CHECKOUT
  // ==========================================================

  const handleCheckout = async () => {

    try {

      setError("");

      setCheckoutLoading(true);

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        throw new Error(
          "Your session has expired. Please login again."
        );
      }

      if (
        cartItems.length === 0
      ) {
        throw new Error(
          "Your cart is empty."
        );
      }

      const data =
        await api.createCheckout(
          token
        );

      if (
        !data?.checkout_url
      ) {
        throw new Error(
          "Stripe checkout URL was not returned."
        );
      }

      window.location.href =
        data.checkout_url;

    } catch (error) {

      console.error(
        "Checkout error:",
        error
      );

      setError(
        error.message ||
        "Unable to start checkout."
      );

      setCheckoutLoading(false);
    }
  };


  // ==========================================================
  // TOTAL QUANTITY
  // ==========================================================

  const totalQuantity =
    cartItems.reduce(
      (sum, item) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );


  // ==========================================================
  // TOTAL PRICE
  // ==========================================================

  const total =
    cartItems.reduce(
      (sum, item) => {

        const price =
          Number(
            item.product?.price || 0
          );

        const quantity =
          Number(
            item.quantity || 0
          );

        return (
          sum +
          price * quantity
        );
      },
      0
    );


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div className="cart-page">

        <div className="cart-loading">

          Loading your cart...

        </div>

      </div>
    );
  }


  // ==========================================================
  // MAIN UI
  // ==========================================================

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

            {cartItems.map((item) => {

              const product =
                item.product;

              const price =
                Number(
                  product?.price || 0
                );

              const quantity =
                Number(
                  item.quantity || 0
                );

              const subtotal =
                price * quantity;

              const imageUrl =
                getProductImage(
                  product
                );

              return (

                <div
                  className="cart-item"
                  key={item.id}
                >

                  {/* ==========================================
                      PRODUCT IMAGE
                  ========================================== */}

                  <div
                    className="cart-product-image"
                    style={{
                      position:
                        "relative",
                    }}
                  >

                    {imageUrl ? (

                      <img
                        src={imageUrl}
                        alt={
                          product?.name ||
                          "Product"
                        }
                        loading="lazy"

                        onError={(event) => {

                          console.error(
                            "Online image failed:",
                            product?.name,
                            imageUrl
                          );

                          event.currentTarget
                            .style
                            .display =
                            "none";

                          const placeholder =
                            event.currentTarget
                              .parentElement
                              .querySelector(
                                ".image-placeholder"
                              );

                          if (
                            placeholder
                          ) {
                            placeholder.style.display =
                              "flex";
                          }
                        }}

                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />

                    ) : null}


                    <div
                      className="image-placeholder"
                      style={{
                        display:
                          imageUrl
                            ? "none"
                            : "flex",

                        width:
                          "100%",

                        height:
                          "100%",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",

                        fontSize:
                          "48px",
                      }}
                    >
                      {getProductPlaceholder(
                        product
                      )}
                    </div>

                  </div>


                  {/* ==========================================
                      PRODUCT DETAILS
                  ========================================== */}

                  <div
                    className="cart-product-info"
                  >

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


                  {/* ==========================================
                      QUANTITY
                  ========================================== */}

                  <div
                    className="quantity-control"
                  >

                    <button
                      type="button"
                      onClick={() =>
                        decreaseQuantity(
                          item
                        )
                      }
                      disabled={
                        quantity <= 1 ||
                        checkoutLoading
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
                      disabled={
                        checkoutLoading
                      }
                    >
                      +
                    </button>

                  </div>


                  {/* ==========================================
                      SUBTOTAL
                  ========================================== */}

                  <div
                    className="cart-subtotal"
                  >

                    ₹
                    {subtotal.toLocaleString(
                      "en-IN"
                    )}

                  </div>


                  {/* ==========================================
                      REMOVE
                  ========================================== */}

                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() =>
                      removeItem(
                        item.id
                      )
                    }
                    disabled={
                      checkoutLoading
                    }
                  >
                    🗑 Remove
                  </button>

                </div>

              );

            })}

          </div>


          {/* ==================================================
              ORDER SUMMARY
          ================================================== */}

          <div
            className="cart-summary"
          >

            <h2>
              Order Summary
            </h2>

            <div className="summary-row">

              <span>
                Items
              </span>

              <span>
                {totalQuantity}
              </span>

            </div>

            <div className="summary-row">

              <span>
                Subtotal
              </span>

              <span>
                ₹
                {total.toLocaleString(
                  "en-IN"
                )}
              </span>

            </div>

            <div className="summary-row">

              <span>
                Delivery
              </span>

              <span>
                FREE
              </span>

            </div>

            <hr />

            <div className="total-row">

              <span>
                Total
              </span>

              <span>
                ₹
                {total.toLocaleString(
                  "en-IN"
                )}
              </span>

            </div>

            <button
              type="button"
              className="checkout-btn"
              onClick={
                handleCheckout
              }
              disabled={
                checkoutLoading ||
                cartItems.length ===
                  0
              }
            >

              {checkoutLoading
                ? "Preparing Checkout..."
                : "Proceed to Checkout"}

            </button>

          </div>

        </div>

      )}

    </div>
  );
}


export default Cart;