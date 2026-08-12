import { useState } from "react";
import { api } from "./api";
import "./App.css";
import Products from "./Products";
import Cart from "./Cart";
import PaymentMethod from "./PaymentMethod";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  const [showCart, setShowCart] = useState(false);
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);

  // ============================================================
  // LOGIN
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
          data.detail || "Login failed ❌"
        );
        return;
      }

      // Store tokens
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

      // Get current user
      const userData = await api.getMe(
        data.access_token
      );

      if (userData?.email) {
        setUser(userData);
        setMessage("Login successful! ✅");
      } else {
        setMessage(
          "Token received, but user details could not be loaded."
        );
      }

      console.log("Login response:", data);
      console.log("User:", userData);

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
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    setUser(null);
    setEmail("");
    setPassword("");
    setMessage("");

    setShowCart(false);
    setShowPaymentMethod(false);
  };

  // ============================================================
  // PAYMENT METHOD PAGE
  // ============================================================

  if (user && showPaymentMethod) {
    return (
      <PaymentMethod
        onBack={() =>
          setShowPaymentMethod(false)
        }

        onContinue={async (paymentMethod) => {
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

            console.log(
              "Selected payment method:",
              paymentMethod
            );

            // Create order using selected method
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

            if (paymentMethod === "cod") {
              alert(
                `Order #${order.id} placed successfully!`
              );

              setShowPaymentMethod(false);
              setShowCart(false);

              return;
            }

            // ==================================================
            // GPAY
            // ==================================================

            if (paymentMethod === "gpay") {
              console.log(
                "GPay selected. Razorpay payment flow will start next."
              );

              /*
                Next step:
                1. Create Razorpay payment order
                2. Open Razorpay Checkout
                3. Verify payment
              */

              alert(
                `Order #${order.id} created. GPay payment flow is ready for integration.`
              );

              setShowPaymentMethod(false);
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

  if (user && showCart) {
    return (
      <Cart
        onBack={() =>
          setShowCart(false)
        }

        onCheckout={() => {
          setShowPaymentMethod(true);
        }}
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

            <form
              onSubmit={handleLogin}
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


              <button type="submit">
                Login
              </button>

            </form>


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


              <button
                type="button"
                className="cart-nav-btn"
                onClick={() =>
                  setShowCart(true)
                }
              >
                🛒 Cart
              </button>

            </div>


            {/* USER DETAILS */}

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

            </div>


            {/* PRODUCTS */}

            <Products />


            {/* LOGOUT */}

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