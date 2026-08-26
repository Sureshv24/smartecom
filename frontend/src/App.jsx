import { useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";

import Products from "./Products";
import Cart from "./Cart";
import PaymentMethod from "./PaymentMethod";

import { useAuth0 } from "@auth0/auth0-react";


function App() {

  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState(null);

  const [message, setMessage] = useState("");


  // ============================================================
  // NOTIFICATION STATE
  // ============================================================

  const [notifications, setNotifications] =
    useState([]);

  const [showNotifications, setShowNotifications] =
    useState(false);


  // ============================================================
  // REAL-TIME WEBSOCKET STATE
  // ============================================================

  const [socket, setSocket] =
    useState(null);

  const [realtimeMessage, setRealtimeMessage] =
    useState("");


  // ============================================================
  // PAGE NAVIGATION
  // ============================================================

  const [showCart, setShowCart] =
    useState(false);

  const [showPaymentMethod, setShowPaymentMethod] =
    useState(false);


  // ============================================================
  // PRODUCT VIEW
  // ============================================================

  const [showAllProducts, setShowAllProducts] =
    useState(false);


  // ============================================================
  // AUTH0
  // ============================================================

  const {
    loginWithRedirect,
    logout: auth0Logout,
    isAuthenticated,
    isLoading: auth0Loading,
    user: auth0User,
  } = useAuth0();


  // ============================================================
  // AUTH0 SOCIAL USER
  // ============================================================

  useEffect(() => {

    if (
      isAuthenticated &&
      auth0User
    ) {

      const socialUser = {

        id:
          auth0User.sub ||
          auth0User.email ||
          "auth0-user",

        name:
          auth0User.name ||
          auth0User.nickname ||
          "Social User",

        email:
          auth0User.email ||
          "",

        role:
          "customer",
      };


      setUser(
        socialUser
      );


      setMessage(
        "Social login successful! ✅"
      );

    }

  }, [
    isAuthenticated,
    auth0User,
  ]);


  // ============================================================
  // RESTORE FASTAPI USER AFTER PAGE REDIRECT
  // ============================================================

  useEffect(() => {

    const restoreUser = async () => {

      const token =
        localStorage.getItem(
          "access_token"
        );


      if (!token) {
        return;
      }


      try {

        const userData =
          await api.getMe(
            token
          );


        if (
          userData?.email
        ) {

          setUser(
            userData
          );

        }

      } catch (error) {

        console.error(
          "Session restore error:",
          error
        );

      }

    };


    restoreUser();

  }, []);


  // ============================================================
  // LOAD NOTIFICATIONS
  // ============================================================

  useEffect(() => {

    if (!user) {
      return;
    }


    const loadNotifications =
      async () => {

        try {

          const token =
            localStorage.getItem(
              "access_token"
            );


          if (!token) {
            return;
          }


          const data =
            await api.getNotifications(
              token
            );


          if (
            Array.isArray(
              data
            )
          ) {

            setNotifications(
              data
            );

          }

          else if (
            Array.isArray(
              data?.notifications
            )
          ) {

            setNotifications(
              data.notifications
            );

          }

          else {

            setNotifications(
              []
            );

          }

        } catch (error) {

          console.error(
            "Notification loading error:",
            error
          );

        }

      };


    // ----------------------------------------------------------
    // Initial load
    // ----------------------------------------------------------

    loadNotifications();


    // ----------------------------------------------------------
    // Refresh every 5 seconds
    // ----------------------------------------------------------

    const interval =
      setInterval(
        loadNotifications,
        5000
      );


    return () => {

      clearInterval(
        interval
      );

    };

  }, [user]);


  // ============================================================
  // WEBSOCKET - REAL-TIME NOTIFICATIONS
  // ============================================================

  useEffect(() => {

    if (!user) {
      return;
    }


    console.log(
      "Connecting to notification WebSocket..."
    );


    // ----------------------------------------------------------
    // CREATE WEBSOCKET CONNECTION
    // ----------------------------------------------------------

    const ws =
      new WebSocket(
        "ws://127.0.0.1:8000/ws/notifications"
      );


    // ----------------------------------------------------------
    // CONNECTION OPENED
    // ----------------------------------------------------------

    ws.onopen = () => {

      console.log(
        "WebSocket connected ✅"
      );


      setSocket(
        ws
      );


      // --------------------------------------------------------
      // Keep connection alive
      // --------------------------------------------------------

      ws.send(
        "ping"
      );

    };


    // ----------------------------------------------------------
    // MESSAGE RECEIVED
    // ----------------------------------------------------------

    ws.onmessage = (
      event
    ) => {

      try {

        const data =
          JSON.parse(
            event.data
          );


        console.log(
          "WebSocket event received:",
          data
        );


        // ------------------------------------------------------
        // PONG
        // ------------------------------------------------------

        if (
          data?.type ===
          "pong"
        ) {

          console.log(
            "WebSocket pong received ✅"
          );

          return;

        }


        // ------------------------------------------------------
        // CART UPDATED
        // ------------------------------------------------------

        if (
          data?.type ===
          "cart_updated"
        ) {

          // ----------------------------------------------------
          // Ignore events belonging to another user
          // ----------------------------------------------------

          if (
            data.user_id !==
            user.id
          ) {

            return;

          }


          console.log(
            "Cart updated in real time ✅",
            data
          );


          // ----------------------------------------------------
          // Display realtime message
          // ----------------------------------------------------

          let text =
            "Cart updated";


          if (
            data.action ===
            "added"
          ) {

            text =
              "Product added to cart";

          }

          else if (
            data.action ===
            "quantity_updated"
          ) {

            text =
              "Cart quantity updated";

          }

          else if (
            data.action ===
            "removed"
          ) {

            text =
              "Product removed from cart";

          }


          setRealtimeMessage(
            text
          );


          // ----------------------------------------------------
          // Clear temporary message
          // ----------------------------------------------------

          setTimeout(() => {

            setRealtimeMessage(
              ""
            );

          }, 3000);

        }

      } catch (error) {

        console.error(
          "Invalid WebSocket message:",
          error
        );

      }

    };


    // ----------------------------------------------------------
    // WEBSOCKET ERROR
    // ----------------------------------------------------------

    ws.onerror = (
      error
    ) => {

      console.error(
        "WebSocket error ❌",
        error
      );

    };


    // ----------------------------------------------------------
    // WEBSOCKET CLOSED
    // ----------------------------------------------------------

    ws.onclose = () => {

      console.log(
        "WebSocket disconnected ❌"
      );


      setSocket(
        null
      );

    };


    // ----------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------

    return () => {

      console.log(
        "Closing WebSocket..."
      );


      ws.close();

    };

  }, [user]);


  // ============================================================
  // UNREAD NOTIFICATION COUNT
  // ============================================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        notification.read_status !==
        "read"
    ).length;


  // ============================================================
  // MARK NOTIFICATION AS READ
  // ============================================================

  const handleNotificationClick =
    async (
      notification
    ) => {

      try {

        const token =
          localStorage.getItem(
            "access_token"
          );


        if (!token) {
          return;
        }


        if (
          notification.read_status !==
          "read"
        ) {

          await api.markNotificationRead(
            notification.id,
            token
          );


          setNotifications(
            (current) =>
              current.map(
                (item) =>
                  item.id ===
                  notification.id
                    ? {
                        ...item,
                        read_status:
                          "read",
                      }
                    : item
              )
          );

        }

      } catch (error) {

        console.error(
          "Mark notification error:",
          error
        );

      }

    };


  // ============================================================
  // EMAIL / PASSWORD LOGIN
  // ============================================================

  const handleLogin =
    async (
      e
    ) => {

      e.preventDefault();


      setMessage(
        "Logging in..."
      );


      setUser(
        null
      );


      try {

        const data =
          await api.login({
            email,
            password,
          });


        if (
          !data.access_token
        ) {

          setMessage(
            data.detail ||
            "Login failed ❌"
          );

          return;

        }


        // ------------------------------------------------------
        // Store access token
        // ------------------------------------------------------

        localStorage.setItem(
          "access_token",
          data.access_token
        );


        // ------------------------------------------------------
        // Store refresh token
        // ------------------------------------------------------

        if (
          data.refresh_token
        ) {

          localStorage.setItem(
            "refresh_token",
            data.refresh_token
          );

        }


        // ------------------------------------------------------
        // Get current user
        // ------------------------------------------------------

        const userData =
          await api.getMe(
            data.access_token
          );


        if (
          userData?.email
        ) {

          setUser(
            userData
          );


          setMessage(
            "Login successful! ✅"
          );

        }

        else {

          setMessage(
            "Token received, but user details could not be loaded."
          );

        }


      } catch (error) {

        console.error(
          "Login error:",
          error
        );


        setMessage(
          error.message ||
          "Unable to connect to FastAPI ❌"
        );

      }

    };


  // ============================================================
  // GOOGLE LOGIN
  // ============================================================

  const handleGoogleLogin =
    async () => {

      try {

        setMessage(
          "Redirecting to Google..."
        );


        await loginWithRedirect({

          authorizationParams: {

            connection:
              "google-oauth2",

          },

        });

      } catch (error) {

        console.error(
          "Google login error:",
          error
        );


        setMessage(
          "Unable to start Google login ❌"
        );

      }

    };


  // ============================================================
  // FACEBOOK LOGIN
  // ============================================================

  const handleFacebookLogin =
    async () => {

      try {

        setMessage(
          "Redirecting to Facebook..."
        );


        await loginWithRedirect({

          authorizationParams: {

            connection:
              "facebook",

          },

        });

      } catch (error) {

        console.error(
          "Facebook login error:",
          error
        );


        setMessage(
          "Unable to start Facebook login ❌"
        );

      }

    };


  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout =
    () => {

      localStorage.removeItem(
        "access_token"
      );


      localStorage.removeItem(
        "refresh_token"
      );


      localStorage.removeItem(
        "user"
      );


      // --------------------------------------------------------
      // Close WebSocket before logout
      // --------------------------------------------------------

      if (
        socket
      ) {

        socket.close();

      }


      setSocket(
        null
      );


      setUser(
        null
      );


      setEmail(
        ""
      );


      setPassword(
        ""
      );


      setMessage(
        ""
      );


      setNotifications(
        []
      );


      setRealtimeMessage(
        ""
      );


      setShowNotifications(
        false
      );


      setShowCart(
        false
      );


      setShowPaymentMethod(
        false
      );


      setShowAllProducts(
        false
      );


      if (
        isAuthenticated
      ) {

        auth0Logout({

          logoutParams: {

            returnTo:
              window.location.origin,

          },

        });

      }

    };


  // ============================================================
  // AUTH0 LOADING
  // ============================================================

  if (
    auth0Loading
  ) {

    return (

      <div
        className="auth-loading-page"
      >

        <div
          className="auth-loading-card"
        >

          <div
            className="loading-spinner"
          >
          </div>


          <h2>
            Loading Smart E-Commerce...
          </h2>


          <p>
            Please wait while we prepare your account.
          </p>

        </div>

      </div>

    );

  }


  // ============================================================
  // PAYMENT PAGE
  // ============================================================

  if (
    user &&
    showPaymentMethod
  ) {

    return (

      <PaymentMethod

        onBack={() =>
          setShowPaymentMethod(
            false
          )
        }


        onContinue={
          async (
            paymentMethod
          ) => {

            try {

              const token =
                localStorage.getItem(
                  "access_token"
                );


              if (!token) {

                throw new Error(
                  "Please login again."
                );

              }


              const order =
                await api.createOrder(
                  paymentMethod,
                  token
                );


              console.log(
                "Order created:",
                order
              );


              // ------------------------------------------------
              // COD
              // ------------------------------------------------

              if (
                paymentMethod ===
                "cod"
              ) {

                alert(
                  `Order #${order.id} placed successfully!`
                );


                setShowPaymentMethod(
                  false
                );


                setShowCart(
                  false
                );


                return;

              }


              // ------------------------------------------------
              // GPAY
              // ------------------------------------------------

              if (
                paymentMethod ===
                "gpay"
              ) {

                alert(
                  `Order #${order.id} created. GPay payment flow is ready for integration.`
                );


                setShowPaymentMethod(
                  false
                );


                setShowCart(
                  false
                );

              }

            } catch (
              error
            ) {

              console.error(
                "Checkout error:",
                error
              );


              alert(
                error.message ||
                "Unable to process checkout."
              );

            }

          }
        }

      />

    );

  }


  // ============================================================
  // CART PAGE
  // ============================================================

  if (
    user &&
    showCart
  ) {

    return (

      <Cart

        onBack={() =>
          setShowCart(
            false
          )
        }


        onCheckout={() =>
          setShowPaymentMethod(
            true
          )
        }

      />

    );

  }


  // ============================================================
  // LOGIN PAGE
  // ============================================================

  if (
    !user
  ) {

    return (

      <div
        className="auth-page"
      >

        <div
          className="auth-card"
        >


          {/* ==================================================
              TOP BRAND ROW
          ================================================== */}

          <div
            className="login-brand-row"
          >


            {/* LEFT - SHOP SMART LOGO */}

            <div
              className="login-logo-side"
            >

              <img
                src="/logo.png"
                alt="Shop Smart E-Commerce"
                className="shop-smart-logo"
              />

            </div>


            {/* RIGHT - SMART E-COMMERCE */}

            <div
              className="login-title-side"
            >

              <h1>
                Smart E-Commerce
              </h1>

              <p>
                Shop smarter. Live better.
              </p>

            </div>

          </div>


          {/* ==================================================
              WELCOME
          ================================================== */}

          <div
            className="auth-heading"
          >

            <h2>
              Welcome back
            </h2>

            <p>
              Login to continue shopping
            </p>

          </div>


          {/* ==================================================
              LOGIN FORM
          ================================================== */}

          <form
            onSubmit={
              handleLogin
            }
          >

            <div
              className="form-group"
            >

              <label>
                Email
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                required
              />

            </div>


            <div
              className="form-group"
            >

              <label>
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                required
              />

            </div>


            <button
              type="submit"
              className="primary-auth-btn"
            >

              Login

            </button>

          </form>


          {/* ==================================================
              SOCIAL DIVIDER
          ================================================== */}

          <div
            className="social-divider"
          >

            <span>
              OR CONTINUE WITH
            </span>

          </div>


          {/* ==================================================
              GOOGLE
          ================================================== */}

          <button
            type="button"
            className="social-login google-login"
            onClick={
              handleGoogleLogin
            }
          >

            <span
              className="social-icon"
            >
              G
            </span>

            Continue with Google

          </button>


          {/* ==================================================
              FACEBOOK
          ================================================== */}

          <button
            type="button"
            className="social-login facebook-login"
            onClick={
              handleFacebookLogin
            }
          >

            <span
              className="social-icon"
            >
              f
            </span>

            Continue with Facebook

          </button>


          {/* ==================================================
              MESSAGE
          ================================================== */}

          {
            message && (

              <p
                className="message"
              >
                {message}
              </p>

            )
          }


        </div>

      </div>

    );

  }


  // ============================================================
  // E-COMMERCE DASHBOARD
  // ============================================================

  return (

    <div
      className="store-app"
    >


      {/* ========================================================
          REAL-TIME CART MESSAGE
      ======================================================== */}

      {
        realtimeMessage && (

          <div
            style={{
              position: "fixed",
              top: "80px",
              right: "20px",
              zIndex: 9999,
              padding: "12px 18px",
              background: "#2563eb",
              color: "white",
              borderRadius: "10px",
              boxShadow:
                "0 8px 20px rgba(0,0,0,0.15)",
              fontWeight: "600",
            }}
          >
            🔔 {realtimeMessage}
          </div>

        )
      }


      {/* ========================================================
          NAVBAR
      ======================================================== */}

      <header
        className="store-navbar"
      >

        <div
          className="store-navbar-inner"
        >


          {/* STORE LOGO */}

          <button
            type="button"
            className="store-logo"
            onClick={() => {

              setShowCart(
                false
              );


              setShowPaymentMethod(
                false
              );


              setShowAllProducts(
                false
              );


              setShowNotifications(
                false
              );

            }}
          >

            <span
              className="store-logo-icon"
            >
              🛍️
            </span>

            <span>
              Smart E-Commerce
            </span>

          </button>


          {/* SEARCH */}

          <div
            className="store-search"
          >

            <span>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search products..."
            />

          </div>


          {/* ==================================================
              NAV ACTIONS
          ================================================== */}

          <div
            className="store-nav-actions"
          >


            {/* ==================================================
                NOTIFICATIONS
            ================================================== */}

            <div
              className="notification-wrapper"
            >

              <button
                type="button"
                className="notification-btn"
                onClick={() =>
                  setShowNotifications(
                    (current) =>
                      !current
                  )
                }
              >

                🔔


                {
                  unreadCount > 0 && (

                    <span
                      className="notification-badge"
                    >

                      {
                        unreadCount
                      }

                    </span>

                  )
                }

              </button>


              {/* =================================================
                  NOTIFICATION DROPDOWN
              ================================================= */}

              {
                showNotifications && (

                  <div
                    className="notification-dropdown"
                  >


                    {/* HEADER */}

                    <div
                      className="notification-header"
                    >

                      <strong>
                        Notifications
                      </strong>

                      <span>
                        {
                          notifications.length
                        }
                      </span>

                    </div>


                    {/* EMPTY */}

                    {
                      notifications.length ===
                      0 ? (

                        <div
                          className="notification-empty"
                        >

                          No notifications

                        </div>

                      ) : (

                        <div
                          className="notification-list"
                        >

                          {
                            notifications.map(
                              (
                                notification
                              ) => (

                                <button
                                  type="button"
                                  key={
                                    notification.id
                                  }
                                  className={
                                    `notification-item ${
                                      notification.read_status !==
                                      "read"
                                        ? "unread"
                                        : ""
                                    }`
                                  }
                                  onClick={() =>
                                    handleNotificationClick(
                                      notification
                                    )
                                  }
                                >


                                  {/* ICON */}

                                  <div
                                    className="notification-icon"
                                  >

                                    {
                                      notification.type ===
                                      "payment_success"
                                        ? "✅"
                                        : notification.type ===
                                          "payment_failed"
                                          ? "❌"
                                          : notification.type ===
                                            "order_confirmed"
                                            ? "📦"
                                            : "🔔"
                                    }

                                  </div>


                                  {/* CONTENT */}

                                  <div
                                    className="notification-content"
                                  >

                                    <strong>

                                      {
                                        String(
                                          notification.type ||
                                          "notification"
                                        )
                                          .replaceAll(
                                            "_",
                                            " "
                                          )
                                          .replace(
                                            /\b\w/g,
                                            (
                                              char
                                            ) =>
                                              char.toUpperCase()
                                          )
                                      }

                                    </strong>


                                    <p>

                                      {
                                        notification.message
                                      }

                                    </p>


                                    <small>

                                      {
                                        notification.timestamp
                                          ? new Date(
                                              notification.timestamp
                                            ).toLocaleString(
                                              "en-IN"
                                            )
                                          : ""
                                      }

                                    </small>

                                  </div>

                                </button>

                              )
                            )
                          }

                        </div>

                      )
                    }

                  </div>

                )
              }

            </div>


            {/* ==================================================
                CART
            ================================================== */}

            <button
              type="button"
              className="nav-action-btn"
              onClick={() =>
                setShowCart(
                  true
                )
              }
            >

              🛒

              <span>
                Cart
              </span>

            </button>


            {/* ==================================================
                USER
            ================================================== */}

            <div
              className="nav-user"
            >

              <div
                className="nav-user-avatar"
              >

                {
                  user?.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                  "U"
                }

              </div>


              <div
                className="nav-user-info"
              >

                <strong>
                  {
                    user.name
                  }
                </strong>

                <small>
                  {
                    user.role
                  }
                </small>

              </div>

            </div>


            {/* ==================================================
                LOGOUT
            ================================================== */}

            <button
              type="button"
              className="nav-logout-btn"
              onClick={
                handleLogout
              }
            >

              Logout

            </button>

          </div>

        </div>

      </header>


      {/* ========================================================
          MAIN STORE
      ======================================================== */}

      <main
        className="store-main"
      >


        {/* ======================================================
            HERO
        ====================================================== */}

        <section
          className="store-hero"
        >

          <div
            className="store-hero-content"
          >

            <span
              className="hero-badge"
            >
              ✨ Smart Shopping Experience
            </span>


            <h1>

              Welcome back,

              <br />

              <span>
                {
                  user.name
                }
              </span>

            </h1>


            <p>
              Discover quality products,
              great prices and a shopping
              experience designed for you.
            </p>


            <button
              type="button"
              className="hero-btn"
              onClick={() => {

                document
                  .getElementById(
                    "products"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  });

              }}
            >

              Explore Products

              <span>
                →
              </span>

            </button>

          </div>


          <div
            className="store-hero-visual"
          >

            <div
              className="hero-circle circle-one"
            >
            </div>

            <div
              className="hero-circle circle-two"
            >
            </div>

            <div
              className="hero-product-icon"
            >
              🛍️
            </div>

          </div>

        </section>


        {/* ======================================================
            USER SUMMARY
        ====================================================== */}

        <section
          className="user-summary-card"
        >

          <div
            className="user-summary-icon"
          >
            👤
          </div>


          <div
            className="user-summary-content"
          >

            <span>
              Signed in as
            </span>

            <strong>
              {
                user.email
              }
            </strong>

          </div>


          <div
            className="role-badge"
          >
            {
              user.role
            }
          </div>

        </section>


        {/* ======================================================
            PRODUCTS
        ====================================================== */}

        <section
          className="store-products-section"
          id="products"
        >

          <div
            className="store-section-heading"
          >

            <div>

              <span>

                {
                  showAllProducts
                    ? "All Products"
                    : "Featured Collection"
                }

              </span>


              <h2>
                Explore Our Products
              </h2>

            </div>


            {/* VIEW ALL */}

            <button
              type="button"
              className="view-all-btn"
              onClick={() => {

                setShowAllProducts(
                  true
                );


                setTimeout(() => {

                  document
                    .getElementById(
                      "products"
                    )
                    ?.scrollIntoView({
                      behavior:
                        "smooth",
                    });

                }, 100);

              }}
            >

              {
                showAllProducts
                  ? "Showing All ✓"
                  : "View All →"
              }

            </button>

          </div>


          <div
            className="store-products-wrapper"
          >

            <Products
              showAll={
                showAllProducts
              }
            />

          </div>

        </section>


        {/* ======================================================
            TRUST FEATURES
        ====================================================== */}

        <section
          className="trust-section"
        >


          <div
            className="trust-card"
          >

            <span>
              🚚
            </span>

            <div>

              <strong>
                Fast Delivery
              </strong>

              <p>
                Quick and reliable delivery
              </p>

            </div>

          </div>


          <div
            className="trust-card"
          >

            <span>
              🔒
            </span>

            <div>

              <strong>
                Secure Shopping
              </strong>

              <p>
                Safe and protected checkout
              </p>

            </div>

          </div>


          <div
            className="trust-card"
          >

            <span>
              💳
            </span>

            <div>

              <strong>
                Easy Payments
              </strong>

              <p>
                GPay and Cash on Delivery
              </p>

            </div>

          </div>


          <div
            className="trust-card"
          >

            <span>
              ⭐
            </span>

            <div>

              <strong>
                Quality Products
              </strong>

              <p>
                Products you can trust
              </p>

            </div>

          </div>


        </section>

      </main>


      {/* ========================================================
          FOOTER
      ======================================================== */}

      <footer
        className="store-footer"
      >

        <div
          className="store-footer-inner"
        >


          <div>

            <div
              className="footer-logo"
            >
              🛍️ Smart E-Commerce
            </div>

            <p>
              A smart shopping experience
              built for modern customers.
            </p>

          </div>


          <div
            className="footer-contact"
          >

            <strong>
              Account
            </strong>

            <span>
              {
                user.email
              }
            </span>

            <span>
              Role: {
                user.role
              }
            </span>

          </div>

        </div>


        <div
          className="footer-bottom"
        >

          © 2026 Smart E-Commerce Platform.
          All rights reserved.

        </div>

      </footer>


    </div>

  );

}


export default App;