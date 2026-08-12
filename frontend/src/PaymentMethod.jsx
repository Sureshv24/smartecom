import { useState } from "react";
import "./App.css";

function PaymentMethod({ onBack, onContinue }) {
  const [paymentMethod, setPaymentMethod] = useState("gpay");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError(
          "Your session has expired. Please login again."
        );
        return;
      }

      if (!paymentMethod) {
        setError("Please select a payment method.");
        return;
      }

      await onContinue(paymentMethod);

    } catch (error) {
      console.error(
        "Payment method error:",
        error
      );

      setError(
        error.message ||
          "Unable to continue with payment."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">

      <div className="payment-container">

        {/* ==================================================
            BACK
        ================================================== */}

        <button
          type="button"
          className="payment-back-btn"
          onClick={onBack}
          disabled={loading}
        >
          ← Back to Cart
        </button>


        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="payment-header">

          <div className="payment-title-icon">
            💳
          </div>

          <h1>
            Choose Payment Method
          </h1>

          <p>
            Select your preferred payment option
            to continue your order.
          </p>

        </div>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="payment-error">
            <span>⚠️</span>

            <span>{error}</span>
          </div>
        )}


        {/* ==================================================
            PAYMENT OPTIONS
        ================================================== */}

        <div className="payment-options">

          {/* ==================================================
              GOOGLE PAY
          ================================================== */}

          <button
            type="button"
            className={`payment-card ${
              paymentMethod === "gpay"
                ? "payment-card-active"
                : ""
            }`}
            onClick={() =>
              setPaymentMethod("gpay")
            }
            disabled={loading}
          >

            <div className="payment-icon gpay-icon">
              G
            </div>

            <div className="payment-info">

              <h2>
                Google Pay
              </h2>

              <p>
                Pay securely using Google Pay
                or UPI.
              </p>

              <span className="payment-badge">
                Recommended
              </span>

            </div>

            <div className="payment-radio">
              {paymentMethod === "gpay"
                ? "●"
                : "○"}
            </div>

          </button>


          {/* ==================================================
              CASH ON DELIVERY
          ================================================== */}

          <button
            type="button"
            className={`payment-card ${
              paymentMethod === "cod"
                ? "payment-card-active"
                : ""
            }`}
            onClick={() =>
              setPaymentMethod("cod")
            }
            disabled={loading}
          >

            <div className="payment-icon cod-icon">
              ₹
            </div>

            <div className="payment-info">

              <h2>
                Cash on Delivery
              </h2>

              <p>
                Pay when your order is
                delivered.
              </p>

              <span className="payment-badge cod-badge">
                No online payment
              </span>

            </div>

            <div className="payment-radio">
              {paymentMethod === "cod"
                ? "●"
                : "○"}
            </div>

          </button>

        </div>


        {/* ==================================================
            SELECTED METHOD
        ================================================== */}

        <div className="selected-payment">

          <span>
            Selected:
          </span>

          <strong>
            {paymentMethod === "gpay"
              ? "Google Pay"
              : "Cash on Delivery"}
          </strong>

        </div>


        {/* ==================================================
            CONTINUE
        ================================================== */}

        <button
          type="button"
          className="payment-continue-btn"
          onClick={handleContinue}
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : paymentMethod === "gpay"
            ? "Continue to Google Pay"
            : "Place COD Order"}
        </button>


        {/* ==================================================
            SECURITY NOTE
        ================================================== */}

        <p className="payment-security">
          🔒 Your payment information is handled
          securely.
        </p>

      </div>

    </div>
  );
}

export default PaymentMethod;