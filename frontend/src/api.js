const API_URL = "http://127.0.0.1:8000";

export const api = {
  // ============================================================
  // REGISTER
  // ============================================================

  register: async (userData) => {
    try {
      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Registration failed"
        );
      }

      return data;
    } catch (error) {
      console.error("Register error:", error);

      if (error.message === "Failed to fetch") {
        throw new Error(
          "Unable to connect to FastAPI"
        );
      }

      throw error;
    }
  },


  // ============================================================
  // LOGIN
  // ============================================================

  login: async (loginData) => {
    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Login failed"
        );
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);

      if (error.message === "Failed to fetch") {
        throw new Error(
          "Unable to connect to FastAPI"
        );
      }

      throw error;
    }
  },


  // ============================================================
  // GET CURRENT USER
  // ============================================================

  getMe: async (token) => {
    const response = await fetch(
      `${API_URL}/auth/me`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Unable to get user details"
      );
    }

    return data;
  },


  // ============================================================
  // GET PRODUCTS
  // ============================================================

  getProducts: async (token) => {
    const response = await fetch(
      `${API_URL}/products`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Unable to load products"
      );
    }

    return data;
  },


  // ============================================================
  // ADD TO CART
  // ============================================================

  addToCart: async (
    productId,
    quantity,
    token
  ) => {
    const response = await fetch(
      `${API_URL}/cart`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Unable to add product to cart"
      );
    }

    return data;
  },


  // ============================================================
  // GET CART
  // ============================================================

  getCart: async (token) => {
    const response = await fetch(
      `${API_URL}/cart`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Unable to load cart"
      );
    }

    return data;
  },


  // ============================================================
  // UPDATE CART
  // ============================================================

  updateCart: async (
    cartId,
    quantity,
    token
  ) => {
    const response = await fetch(
      `${API_URL}/cart/${cartId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quantity: quantity,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Unable to update cart"
      );
    }

    return data;
  },


  // ============================================================
  // DELETE CART ITEM
  // ============================================================

  deleteCart: async (
    cartId,
    token
  ) => {
    const response = await fetch(
      `${API_URL}/cart/${cartId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      let data = {};

      try {
        data = await response.json();
      } catch {
        // Empty response body
      }

      throw new Error(
        data.detail ||
          "Unable to remove cart item"
      );
    }

    return true;
  },


  // ============================================================
  // CREATE ORDER
  // POST /orders
  // paymentMethod = "gpay" | "cod"
  // ============================================================

  createOrder: async (
    paymentMethod,
    token
  ) => {
    const response = await fetch(
      `${API_URL}/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Unable to create order"
      );
    }

    return data;
  },


  // ============================================================
  // GET MY ORDERS
  // GET /orders
  // ============================================================

  getOrders: async (token) => {
    const response = await fetch(
      `${API_URL}/orders`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Unable to load orders"
      );
    }

    return data;
  },


  // ============================================================
  // GET ORDER BY ID
  // GET /orders/{orderId}
  // ============================================================

  getOrder: async (
    orderId,
    token
  ) => {
    const response = await fetch(
      `${API_URL}/orders/${orderId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Unable to load order"
      );
    }

    return data;
  },


  // ============================================================
  // CREATE PAYMENT ORDER
  // POST /payments/create/{orderId}
  // GPay / Razorpay
  // ============================================================

  createPaymentOrder: async (
    orderId,
    token
  ) => {
    const response = await fetch(
      `${API_URL}/payments/create/${orderId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Unable to create payment order"
      );
    }

    return data;
  },


  // ============================================================
  // VERIFY PAYMENT
  // POST /payments/verify
  // ============================================================

  verifyPayment: async (
    paymentData,
    token
  ) => {
    const response = await fetch(
      `${API_URL}/payments/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Payment verification failed"
      );
    }

    return data;
  },


  // ============================================================
  // GET PAYMENT BY ORDER
  // GET /payments/order/{orderId}
  // ============================================================

  getPayment: async (
    orderId,
    token
  ) => {
    const response = await fetch(
      `${API_URL}/payments/order/${orderId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail ||
          "Unable to load payment"
      );
    }

    return data;
  },
};