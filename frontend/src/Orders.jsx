import { useEffect, useState } from "react";
import { api } from "./api";
import "./Orders.css";

function Orders({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ==========================================================
  // LOAD ORDERS
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setPageError("");

        const token = localStorage.getItem("access_token");

        if (!token) {
          throw new Error("Please login again.");
        }

        const data = await api.getOrders(token);

        if (!mounted) {
          return;
        }

        if (Array.isArray(data)) {
          setOrders(data);
        } else if (Array.isArray(data?.orders)) {
          setOrders(data.orders);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("Orders loading error:", error);

        if (mounted) {
          setPageError(
            error.message ||
            "Unable to load orders."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadOrders();

    return () => {
      mounted = false;
    };
  }, []);

  // ==========================================================
  // STATUS
  // ==========================================================

  const getOrderStatus = (order) => {
    return String(
      order?.order_status ??
      order?.status ??
      ""
    )
      .trim()
      .toLowerCase();
  };

  const hasReturnRequest = (order) => {
    const status = getOrderStatus(order);

    return (
      status === "return requested" ||
      status === "return_requested"
    );
  };

  const formatStatus = (order) => {
    const value =
      order?.order_status ??
      order?.status ??
      "Unknown";

    return String(value)
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (char) => char.toUpperCase()
      );
  };

  const formatPaymentStatus = (order) => {
    return String(
      order?.payment_status ??
      "Unknown"
    )
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (char) => char.toUpperCase()
      );
  };

  // ==========================================================
  // DATE
  // ==========================================================

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString("en-IN");
  };

  // ==========================================================
  // RETURN WINDOW
  // ==========================================================

  const isWithinReturnWindow = (order) => {
    if (!order?.created_at) {
      return false;
    }

    const createdAt = new Date(
      order.created_at
    );

    if (Number.isNaN(createdAt.getTime())) {
      return false;
    }

    const sevenDays =
      7 * 24 * 60 * 60 * 1000;

    const deadline =
      createdAt.getTime() + sevenDays;

    return Date.now() <= deadline;
  };

  // ==========================================================
  // CAN REQUEST RETURN
  // ==========================================================

  const canRequestReturn = (order) => {
    if (hasReturnRequest(order)) {
      return false;
    }

    return (
      getOrderStatus(order) === "delivered" &&
      isWithinReturnWindow(order)
    );
  };

  // ==========================================================
  // OPEN RETURN FORM
  // ==========================================================

  const openReturnForm = (order) => {
    setSelectedOrder(order);
    setReason("");
    setComment("");
    setPageError("");
  };

  // ==========================================================
  // CLOSE RETURN FORM
  // ==========================================================

  const closeReturnForm = () => {
    if (submitting) {
      return;
    }

    setSelectedOrder(null);
    setReason("");
    setComment("");
    setPageError("");
  };

  // ==========================================================
  // SUBMIT RETURN
  // ==========================================================

  const handleSubmitReturn = async (event) => {
    event.preventDefault();

    if (!selectedOrder) {
      return;
    }

    const cleanedReason =
      reason.trim();

    const cleanedComment =
      comment.trim();

    if (!cleanedReason) {
      setPageError(
        "Please enter a return reason."
      );
      return;
    }

    if (!canRequestReturn(selectedOrder)) {
      setPageError(
        "This order is no longer eligible for return."
      );
      return;
    }

    try {
      setSubmitting(true);
      setPageError("");
      setSuccessMessage("");

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        throw new Error(
          "Please login again."
        );
      }

      const response =
        await api.requestReturn(
          selectedOrder.id,
          {
            reason: cleanedReason,
            comment:
              cleanedComment || null,
          },
          token
        );

      console.log(
        "Return request created:",
        response
      );

      setOrders(
        (currentOrders) =>
          currentOrders.map(
            (order) =>
              order.id ===
              selectedOrder.id
                ? {
                    ...order,
                    order_status:
                      "Return Requested",
                    status:
                      "Return Requested",
                  }
                : order
          )
      );

      setSuccessMessage(
        `Return request submitted successfully for Order #${selectedOrder.id}.`
      );

      setSelectedOrder(null);
      setReason("");
      setComment("");
    } catch (error) {
      console.error(
        "Return request error:",
        error
      );

      setPageError(
        error.message ||
        "Unable to submit return request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="orders-page">
        <div className="orders-loading">
          <div className="orders-spinner" />

          <h2>
            Loading your orders...
          </h2>

          <p>
            Please wait while we fetch your order history.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="orders-page">
      <div className="orders-container">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="orders-header">
          <div className="orders-title-area">
            <div className="orders-page-badge">
              📦 Order Management
            </div>

            <h1>
              My Orders
            </h1>

            <p>
              View your orders, payment details,
              and request returns when eligible.
            </p>
          </div>

          <button
            type="button"
            className="orders-back-button"
            onClick={onBack}
          >
            ← Back to Store
          </button>
        </div>

        {/* ====================================================
            SUCCESS
        ==================================================== */}

        {successMessage && (
          <div className="orders-alert orders-success">
            <span className="orders-alert-icon">
              ✓
            </span>

            <span>
              {successMessage}
            </span>
          </div>
        )}

        {/* ====================================================
            ERROR
        ==================================================== */}

        {pageError && !selectedOrder && (
          <div className="orders-alert orders-error">
            <span className="orders-alert-icon">
              !
            </span>

            <span>
              {pageError}
            </span>
          </div>
        )}

        {/* ====================================================
            NO ORDERS
        ==================================================== */}

        {orders.length === 0 ? (
          <div className="orders-empty-card">
            <div className="orders-empty-icon">
              📦
            </div>

            <h2>
              No orders yet
            </h2>

            <p>
              Your placed orders will appear here.
            </p>

            <button
              type="button"
              className="orders-empty-button"
              onClick={onBack}
            >
              Continue Shopping
            </button>
          </div>
        ) : (

          <div className="orders-list">

            {orders.map((order) => {
              const status =
                getOrderStatus(order);

              const alreadyRequested =
                hasReturnRequest(order);

              const returnAllowed =
                canRequestReturn(order);

              return (
                <article
                  key={order.id}
                  className="order-card"
                >

                  {/* ==========================================
                      ORDER TOP
                  ========================================== */}

                  <div className="order-card-header">

                    <div>
                      <span className="order-label">
                        ORDER
                      </span>

                      <h2>
                        #{order.id}
                      </h2>

                      <p className="order-date">
                        Placed on{" "}
                        {formatDate(
                          order.created_at
                        )}
                      </p>
                    </div>

                    <span
                      className={
                        `order-status ${
                          alreadyRequested
                            ? "status-return"
                            : status === "delivered"
                              ? "status-delivered"
                              : status === "cancelled"
                                ? "status-cancelled"
                                : "status-pending"
                        }`
                      }
                    >
                      {formatStatus(order)}
                    </span>

                  </div>

                  {/* ==========================================
                      SUMMARY
                  ========================================== */}

                  <div className="order-summary-grid">

                    <div className="order-summary-box">
                      <span>
                        Total Amount
                      </span>

                      <strong>
                        ₹
                        {Number(
                          order.total_amount || 0
                        ).toFixed(2)}
                      </strong>
                    </div>

                    <div className="order-summary-box">
                      <span>
                        Payment Status
                      </span>

                      <strong>
                        {formatPaymentStatus(
                          order
                        )}
                      </strong>
                    </div>

                    <div className="order-summary-box">
                      <span>
                        Total Items
                      </span>

                      <strong>
                        {Array.isArray(
                          order.items
                        )
                          ? order.items.length
                          : 0}
                      </strong>
                    </div>

                  </div>

                  {/* ==========================================
                      ITEMS
                  ========================================== */}

                  {Array.isArray(
                    order.items
                  ) &&
                  order.items.length > 0 && (
                    <div className="order-items-section">

                      <div className="order-section-title">
                        Order Items
                      </div>

                      <div className="order-items-list">

                        {order.items.map(
                          (item) => (
                            <div
                              key={item.id}
                              className="order-item-row"
                            >

                              <div className="order-item-info">
                                <strong>
                                  {item.product_name}
                                </strong>

                                <span>
                                  Quantity:{" "}
                                  {item.quantity}
                                </span>
                              </div>

                              <strong className="order-item-price">
                                ₹
                                {Number(
                                  item.subtotal || 0
                                ).toFixed(2)}
                              </strong>

                            </div>
                          )
                        )}

                      </div>
                    </div>
                  )}

                  {/* ==========================================
                      RETURN ACTION
                  ========================================== */}

                  <div className="order-actions">

                    {returnAllowed && (
                      <button
                        type="button"
                        className="request-return-button"
                        onClick={() =>
                          openReturnForm(order)
                        }
                      >
                        ↩ Request Return
                      </button>
                    )}

                    {alreadyRequested && (
                      <div className="return-requested-badge">
                        ✓ Return Requested
                      </div>
                    )}

                    {!returnAllowed &&
                      !alreadyRequested &&
                      status !== "delivered" && (
                        <span className="return-unavailable">
                          Return available after delivery
                        </span>
                      )}

                    {!returnAllowed &&
                      !alreadyRequested &&
                      status === "delivered" &&
                      !isWithinReturnWindow(order) && (
                        <span className="return-unavailable">
                          7-day return window expired
                        </span>
                      )}

                  </div>

                </article>
              );
            })}

          </div>
        )}

      </div>

      {/* ========================================================
          RETURN MODAL
      ======================================================== */}

      {selectedOrder && (
        <div
          className="return-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeReturnForm();
            }
          }}
        >

          <div className="return-modal">

            <div className="return-modal-header">

              <div>
                <span className="return-modal-label">
                  ORDER #{selectedOrder.id}
                </span>

                <h2>
                  Request Return
                </h2>
              </div>

              <button
                type="button"
                className="return-close-button"
                onClick={closeReturnForm}
                disabled={submitting}
                aria-label="Close"
              >
                ×
              </button>

            </div>

            <div className="return-modal-divider" />

            <form
              onSubmit={handleSubmitReturn}
            >

              {/* REASON */}

              <div className="return-form-group">

                <label htmlFor="return-reason">
                  Reason
                  <span>
                    *
                  </span>
                </label>

                <textarea
                  id="return-reason"
                  value={reason}
                  onChange={(event) =>
                    setReason(
                      event.target.value
                    )
                  }
                  placeholder="Tell us why you want to return this product"
                  maxLength={255}
                  rows={4}
                  required
                  disabled={submitting}
                />

                <small>
                  {reason.length}/255
                </small>

              </div>

              {/* COMMENT */}

              <div className="return-form-group">

                <label htmlFor="return-comment">
                  Comment
                  <em>
                    Optional
                  </em>
                </label>

                <textarea
                  id="return-comment"
                  value={comment}
                  onChange={(event) =>
                    setComment(
                      event.target.value
                    )
                  }
                  placeholder="Add any additional details"
                  rows={4}
                  disabled={submitting}
                />

              </div>

              {/* ERROR */}

              {pageError && (
                <div className="modal-error">
                  {pageError}
                </div>
              )}

              {/* ACTIONS */}

              <div className="return-modal-actions">

                <button
                  type="button"
                  className="return-cancel-button"
                  onClick={closeReturnForm}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="return-submit-button"
                  disabled={submitting}
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Return"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;