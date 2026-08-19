import { useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";


// ============================================================
// ONLINE PRODUCT IMAGES
// Same image mapping used in Products.jsx
// ============================================================

const ONLINE_PRODUCT_IMAGES = {
  "wireless headphones":
    "https://images.rawpixel.com/image_png_social_square/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI0LTA3L3Jhd3BpeGVsX29mZmljZV8zNF9jbG9zZXVwX3Byb2R1Y3RfcGhvdG9ncmFwaHlfb2ZfYV93aGl0ZV9ibGFua18zY2MwOWUzYy00ZjdkLTQzMTQtOWYwMi1kY2EzOTgzZjBkOGEucG5n.png",

  "smart watch":
    "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTEwL3JtNTUxLTM3LWFwcGxld2F0Y2gtMzctYl8xLnBuZw.png",
};


// ============================================================
// FALLBACK IMAGE
// ============================================================

const FALLBACK_IMAGE =
  "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTEwL3JtNTUxLTM3LWFwcGxld2F0Y2gtMzctYl8xLnBuZw.png";


// ============================================================
// GET PRODUCT IMAGE
// ============================================================

const getProductImage = (product) => {

  const productName = (
    product?.name || ""
  )
    .trim()
    .toLowerCase();


  // ----------------------------------------------------------
  // 1. Use known product name mapping
  // ----------------------------------------------------------

  if (
    ONLINE_PRODUCT_IMAGES[productName]
  ) {
    return ONLINE_PRODUCT_IMAGES[
      productName
    ];
  }


  // ----------------------------------------------------------
  // 2. Backend image array with full URL
  // ----------------------------------------------------------

  if (
    Array.isArray(product?.images)
  ) {

    const image =
      product.images[0];


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


  // ----------------------------------------------------------
  // 3. Backend image string with full URL
  // ----------------------------------------------------------

  if (
    typeof product?.images === "string"
  ) {

    const image =
      product.images.trim();


    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }


    // --------------------------------------------------------
    // 4. Existing database filenames
    // --------------------------------------------------------

    const fileName =
      image.toLowerCase();


    if (
      fileName === "headphones.jpg" ||
      fileName === "headphone.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "wireless headphones"
      ];
    }


    if (
      fileName === "smart-watch.jpg" ||
      fileName === "smartwatch.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "smart watch"
      ];
    }
  }


  // ----------------------------------------------------------
  // 5. Final fallback
  // ----------------------------------------------------------

  return FALLBACK_IMAGE;
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


  // ============================================================
  // LOAD CART
  // ============================================================

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


      if (
        Array.isArray(data)
      ) {

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

  const increaseQuantity =
    async (item) => {

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
            Number(
              item.quantity
            ) + 1,
            token
          );


        setCartItems(
          (current) =>
            current.map(
              (cartItem) =>
                cartItem.id ===
                item.id
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

  const decreaseQuantity =
    async (item) => {

      const quantity =
        Number(
          item.quantity
        );


      if (
        quantity <= 1
      ) {
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


        setCartItems(
          (current) =>
            current.map(
              (cartItem) =>
                cartItem.id ===
                item.id
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

  const removeItem =
    async (cartId) => {

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


        setCartItems(
          (current) =>
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
            "Unable to remove item"
        );
      }
    };


  // ============================================================
  // CREATE STRIPE CHECKOUT
  // ============================================================

  const handleCheckout =
    async () => {

      try {

        setError(
          ""
        );

        setCheckoutLoading(
          true
        );


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


        console.log(
          "Creating checkout..."
        );


        const data =
          await api.createCheckout(
            token
          );


        console.log(
          "Checkout response:",
          data
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


        setCheckoutLoading(
          false
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
  // TOTAL PRICE
  // ============================================================

  const total =
    cartItems.reduce(
      (sum, item) => {

        const price =
          Number(
            item.product?.price ||
              0
          );


        const quantity =
          Number(
            item.quantity ||
              0
          );


        return (
          sum +
          price * quantity
        );
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


        /* ====================================================
           CART CONTENT
        ==================================================== */

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


                    {/* ==================================================
                        PRODUCT IMAGE
                    ================================================== */}

                    <div className="cart-product-image">

                      <img
                        src={imageUrl}
                        alt={
                          product?.name ||
                          "Product"
                        }

                        loading="lazy"

                        onError={(
                          event
                        ) => {

                          if (
                            event.currentTarget.src !==
                            FALLBACK_IMAGE
                          ) {

                            event.currentTarget.src =
                              FALLBACK_IMAGE;

                          }
                        }}
                      />

                    </div>


                    {/* ==================================================
                        PRODUCT DETAILS
                    ================================================== */}

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


                    {/* ==================================================
                        QUANTITY
                    ================================================== */}

                    <div className="quantity-control">

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


                    {/* ==================================================
                        SUBTOTAL
                    ================================================== */}

                    <div className="cart-subtotal">

                      ₹
                      {subtotal.toLocaleString(
                        "en-IN"
                      )}

                    </div>


                    {/* ==================================================
                        REMOVE
                    ================================================== */}

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
                {total.toLocaleString(
                  "en-IN"
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


            {/* TOTAL */}

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
                CHECKOUT
            ================================================== */}

            <button
              type="button"
              className="checkout-btn"

              onClick={
                handleCheckout
              }

              disabled={
                checkoutLoading ||
                cartItems.length === 0
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