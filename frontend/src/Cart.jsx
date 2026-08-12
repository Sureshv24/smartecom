import { useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";

function Cart({ onBack, onCheckout }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("access_token");

  // ============================================================
  // LOAD CART
  // ============================================================

  const loadCart = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        throw new Error("Please login again.");
      }

      const data = await api.getCart(token);

      if (Array.isArray(data)) {
        setCartItems(data);
      } else if (Array.isArray(data.items)) {
        setCartItems(data.items);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("Load cart error:", error);

      setError(
        error.message || "Unable to load cart"
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

  const increaseQuantity = async (item) => {
    try {
      setError("");

      const updatedItem = await api.updateCart(
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
          "Unable to update quantity"
      );
    }
  };

  // ============================================================
  // DECREASE QUANTITY
  // ============================================================

  const decreaseQuantity = async (item) => {
    const quantity = Number(item.quantity);

    if (quantity <= 1) {
      return;
    }

    try {
      setError("");

      const updatedItem = await api.updateCart(
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
          "Unable to update quantity"
      );
    }
  };

  // ============================================================
  // REMOVE ITEM
  // ============================================================

  const removeItem = async (cartId) => {
    try {
      setError("");

      await api.deleteCart(
        cartId,
        token
      );

      setCartItems((current) =>
        current.filter(
          (item) => item.id !== cartId
        )
      );
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

  const totalQuantity = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  // ============================================================
  // TOTAL PRICE
  // ============================================================

  const total = cartItems.reduce(
    (sum, item) => {
      const price = Number(
        item.product?.price || 0
      );

      const quantity = Number(
        item.quantity || 0
      );

      return sum + price * quantity;
    },
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
          ERROR MESSAGE
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

        /* ====================================================
           CART CONTENT
        ==================================================== */

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

              return (
                <div
                  className="cart-item"
                  key={item.id}
                >

                  {/* PRODUCT IMAGE */}

                  <div className="cart-product-image">

                    <div className="image-placeholder">
                      ⌚
                    </div>

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
                        decreaseQuantity(item)
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
                        increaseQuantity(item)
                      }
                    >
                      +
                    </button>

                  </div>


                  {/* SUBTOTAL */}

                  <div className="cart-subtotal">

                    ₹
                    {subtotal.toLocaleString(
                      "en-IN"
                    )}

                  </div>


                  {/* REMOVE */}

                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() =>
                      removeItem(item.id)
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

          <div className="cart-summary">

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


            {/* ==================================================
                PROCEED TO CHECKOUT
            ================================================== */}

            <button
              type="button"
              className="checkout-btn"
              onClick={() => {
                if (cartItems.length === 0) {
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