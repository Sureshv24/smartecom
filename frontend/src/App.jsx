import { useState, useEffect } from "react";
import { api } from "./api";
import "./App.css";

import Products from "./Products";
import Cart from "./Cart";
import PaymentMethod from "./PaymentMethod";

import { useAuth0 } from "@auth0/auth0-react";


function App() {
  // ============================================================
  // LOCAL LOGIN STATE
  // ============================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  // ============================================================
  // PAGE NAVIGATION
  // ============================================================

  const [showCart, setShowCart] = useState(false);
  const [showPaymentMethod, setShowPaymentMethod] =
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
    if (isAuthenticated && auth0User) {
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

        role: "customer",
      };

      setUser(socialUser);

      setMessage(
        "Social login successful! ✅"
      );
    }
  }, [isAuthenticated, auth0User]);


  // ============================================================
  // EMAIL / PASSWORD LOGIN
  // ============================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("Logging in...");
    setUser(null);

    try {
      const data = await api.login({
        email,
        password,
      });

      if (!data.access_token) {
        setMessage(
          data.detail ||
            "Login failed ❌"
        );

        return;
      }

      // Store FastAPI JWT
      localStorage.setItem(
        "access_token",
        data.access_token
      );

      if (data.refresh_token) {
        localStorage.setItem(
          "refresh_token",
          data.refresh_token
        );
      }

      // Get FastAPI user
      const userData = await api.getMe(
        data.access_token
      );

      if (userData?.email) {
        setUser(userData);

        setMessage(
          "Login successful! ✅"
        );
      } else {
        setMessage(
          "Token received, but user details could not be loaded."
        );
      }

      console.log(
        "Login response:",
        data
      );

      console.log(
        "User:",
        userData
      );

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

  const handleGoogleLogin = async () => {
    try {
      setMessage(
        "Redirecting to Google..."
      );

      await loginWithRedirect({
        authorizationParams: {
          connection: "google-oauth2",
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

  const handleFacebookLogin = async () => {
    try {
      setMessage(
        "Redirecting to Facebook..."
      );

      await loginWithRedirect({
        authorizationParams: {
          connection: "facebook",
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

  const handleLogout = () => {
    // FastAPI token cleanup
    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "refresh_token"
    );

    localStorage.removeItem(
      "user"
    );

    // Reset React state
    setUser(null);

    setEmail("");
    setPassword("");
    setMessage("");

    setShowCart(false);
    setShowPaymentMethod(false);

    // Auth0 logout
    if (isAuthenticated) {
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

  if (auth0Loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>
            Loading authentication...
          </h2>

          <p>
            Please wait...
          </p>
        </div>
      </div>
    );
  }


  // ============================================================
  // PAYMENT METHOD PAGE
  // ============================================================

  if (
    user &&
    showPaymentMethod
  ) {
    return (
      <PaymentMethod
        onBack={() =>
          setShowPaymentMethod(false)
        }

        onContinue={async (
          paymentMethod
        ) => {
          try {
            const token =
              localStorage.getItem(
                "access_token"
              );

            /*
              Email/password users have
              the FastAPI JWT.

              Auth0 social users currently
              don't have a FastAPI JWT yet.
            */

            if (!token) {
              throw new Error(
                "Your social account still needs to be connected to the FastAPI account."
              );
            }

            console.log(
              "Selected payment method:",
              paymentMethod
            );

            // Create order
            const order =
              await api.createOrder(
                paymentMethod,
                token
              );

            console.log(
              "Order created:",
              order
            );


            // ==================================================
            // COD
            // ==================================================

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

              setShowCart(false);

              return;
            }


            // ==================================================
            // GPAY
            // ==================================================

            if (
              paymentMethod ===
              "gpay"
            ) {
              alert(
                `Order #${order.id} created. GPay payment integration is next.`
              );

              setShowPaymentMethod(
                false
              );

              setShowCart(false);
            }

          } catch (error) {
            console.error(
              "Checkout error:",
              error
            );

            alert(
              error.message ||
                "Unable to process checkout."
            );
          }
        }}
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
          setShowCart(false)
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
  // MAIN UI
  // ============================================================

  return (
    <div className="login-container">

      <div className="login-card">

        {!user ? (

          // ====================================================
          // LOGIN PAGE
          // ====================================================

          <>
            <h1>
              Smart E-Commerce
            </h1>

            <p>
              Login to your account
            </p>


            {/* ==================================================
                EMAIL / PASSWORD LOGIN
            ================================================== */}

            <form
              onSubmit={
                handleLogin
              }
            >

              <div className="form-group">

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


              <div className="form-group">

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
              >
                Login
              </button>

            </form>


            {/* ==================================================
                SOCIAL DIVIDER
            ================================================== */}

            <div className="social-divider">
              <span>OR</span>
            </div>


            {/* ==================================================
                GOOGLE LOGIN
            ================================================== */}

            <button
              type="button"
              className="social-login google-login"
              onClick={
                handleGoogleLogin
              }
            >

              <span className="social-icon">
              
              </span>

              Continue with Google

            </button>


            {/* ==================================================
                FACEBOOK LOGIN
            ================================================== */}

            <button
              type="button"
              className="social-login facebook-login"
              onClick={
                handleFacebookLogin
              }
            >

              <span className="social-icon">
              
              </span>

              Continue with Facebook

            </button>


            {/* ==================================================
                MESSAGE
            ================================================== */}

            {message && (
              <p className="message">
                {message}
              </p>
            )}

          </>

        ) : (

          // ====================================================
          // DASHBOARD
          // ====================================================

          <>
            <div className="dashboard-header">

              <div>

                <h1>
                  Welcome! 👋
                </h1>

                <p>
                  You are successfully
                  logged in.
                </p>

              </div>


              {/* CART */}

              <button
                type="button"
                className="cart-nav-btn"
                onClick={() =>
                  setShowCart(
                    true
                  )
                }
              >
                🛒 Cart
              </button>

            </div>


            {/* ==================================================
                USER DETAILS
            ================================================== */}

            <div className="user-info">

              <h3>
                User Details
              </h3>

              <p>
                <strong>
                  Name:
                </strong>{" "}
                {user.name}
              </p>

              <p>
                <strong>
                  Email:
                </strong>{" "}
                {user.email}
              </p>

              <p>
                <strong>
                  Role:
                </strong>{" "}
                {user.role}
              </p>

              {isAuthenticated && (
                <p>
                  <strong>
                    Login:
                  </strong>{" "}
                  Auth0 Social Login
                </p>
              )}

            </div>


            {/* ==================================================
                PRODUCTS
            ================================================== */}

            <Products />


            {/* ==================================================
                LOGOUT
            ================================================== */}

            <button
              type="button"
              className="logout-btn"
              onClick={
                handleLogout
              }
            >
              Logout
            </button>

          </>

        )}

      </div>

    </div>
  );
}


export default App;