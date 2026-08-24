const API_URL = "http://127.0.0.1:8000";


// ============================================================
// AUTH TOKEN HELPERS
// ============================================================

const getAccessToken = () => {
  return localStorage.getItem(
    "access_token"
  );
};


const getRefreshToken = () => {
  return localStorage.getItem(
    "refresh_token"
  );
};


const saveTokens = (data) => {

  if (data?.access_token) {

    localStorage.setItem(
      "access_token",
      data.access_token
    );

  }


  if (data?.refresh_token) {

    localStorage.setItem(
      "refresh_token",
      data.refresh_token
    );

  }

};


const clearTokens = () => {

  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "refresh_token"
  );

};


// ============================================================
// REFRESH ACCESS TOKEN
// POST /auth/refresh
// ============================================================

const refreshAccessToken = async () => {

  const refreshToken =
    getRefreshToken();


  if (!refreshToken) {

    throw new Error(
      "Refresh token not available"
    );

  }


  try {

    const response = await fetch(
      `${API_URL}/auth/refresh`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          refresh_token:
            refreshToken,
        }),
      }
    );


    const data =
      await response.json();


    if (!response.ok) {

      clearTokens();

      throw new Error(
        data.detail ||
          "Session expired. Please login again."
      );

    }


    saveTokens(data);


    return data.access_token;


  } catch (error) {

    console.error(
      "Refresh token error:",
      error
    );


    clearTokens();


    throw new Error(
      error.message ||
        "Session expired. Please login again."
    );

  }

};


// ============================================================
// AUTHENTICATED FETCH
// Automatically refreshes expired access token once.
// ============================================================

const authenticatedFetch = async (
  url,
  options = {},
  retry = true
) => {

  let token =
    getAccessToken();


  if (!token) {

    throw new Error(
      "Please login again."
    );

  }


  // ----------------------------------------------------------
  // Add authorization header
  // ----------------------------------------------------------

  const headers = {

    ...(options.headers || {}),

    Authorization:
      `Bearer ${token}`,

  };


  let response;


  try {

    response = await fetch(
      url,
      {
        ...options,
        headers,
      }
    );


  } catch (error) {

    console.error(
      "Network error:",
      error
    );


    if (
      error.message ===
      "Failed to fetch"
    ) {

      throw new Error(
        "Unable to connect to FastAPI"
      );

    }


    throw error;

  }


  // ----------------------------------------------------------
  // Token expired / unauthorized
  // ----------------------------------------------------------

  if (
    response.status === 401 &&
    retry
  ) {

    try {

      console.log(
        "Access token expired. Refreshing token..."
      );


      const newAccessToken =
        await refreshAccessToken();


      const retryHeaders = {

        ...(options.headers || {}),

        Authorization:
          `Bearer ${newAccessToken}`,

      };


      console.log(
        "Retrying request with new access token..."
      );


      return await fetch(
        url,
        {
          ...options,
          headers:
            retryHeaders,
        }
      );


    } catch (refreshError) {

      console.error(
        "Token refresh failed:",
        refreshError
      );


      throw refreshError;

    }

  }


  return response;

};


// ============================================================
// JSON RESPONSE HELPER
// ============================================================

const parseResponse = async (
  response
) => {

  let data = null;


  try {

    data =
      await response.json();


  } catch {

    data = null;

  }


  if (!response.ok) {

    throw new Error(
      data?.detail ||
        `Request failed with status ${response.status}`
    );

  }


  return data;

};


// ============================================================
// API
// ============================================================

export const api = {


  // ==========================================================
  // REGISTER
  // ==========================================================

  register: async (
    userData
  ) => {

    try {

      const response =
        await fetch(
          `${API_URL}/auth/register`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                userData
              ),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
            "Registration failed"
        );

      }


      return data;


    } catch (error) {

      console.error(
        "Register error:",
        error
      );


      if (
        error.message ===
        "Failed to fetch"
      ) {

        throw new Error(
          "Unable to connect to FastAPI"
        );

      }


      throw error;

    }

  },


  // ==========================================================
  // LOGIN
  // ==========================================================

  login: async (
    loginData
  ) => {

    try {

      const response =
        await fetch(
          `${API_URL}/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                loginData
              ),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
            "Login failed"
        );

      }


      // ------------------------------------------------------
      // Save tokens immediately
      // ------------------------------------------------------

      saveTokens(data);


      return data;


    } catch (error) {

      console.error(
        "Login error:",
        error
      );


      if (
        error.message ===
        "Failed to fetch"
      ) {

        throw new Error(
          "Unable to connect to FastAPI"
        );

      }


      throw error;

    }

  },


  // ==========================================================
  // GET CURRENT USER
  // GET /auth/me
  // ==========================================================

  getMe: async (
    token
  ) => {

    // Use supplied token if available,
    // otherwise use localStorage token.

    const accessToken =
      token ||
      getAccessToken();


    if (!accessToken) {

      throw new Error(
        "Please login again."
      );

    }


    let response;


    try {

      response =
        await fetch(
          `${API_URL}/auth/me`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          }
        );


    } catch (error) {

      console.error(
        "Get user error:",
        error
      );


      throw new Error(
        "Unable to connect to FastAPI"
      );

    }


    // --------------------------------------------------------
    // Token expired
    // --------------------------------------------------------

    if (
      response.status === 401
    ) {

      const newToken =
        await refreshAccessToken();


      response =
        await fetch(
          `${API_URL}/auth/me`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${newToken}`,
            },
          }
        );

    }


    return parseResponse(
      response
    );

  },


  // ==========================================================
  // GET PRODUCTS
  // GET /products
  // ==========================================================

  getProducts: async (
    token
  ) => {

    const accessToken =
      token ||
      getAccessToken();


    if (!accessToken) {

      throw new Error(
        "Please login again."
      );

    }


    const response =
      await authenticatedFetch(
        `${API_URL}/products`,
        {
          method: "GET",
        }
      );


    return parseResponse(
      response
    );

  },


  // ==========================================================
  // GET PRODUCT BY ID
  // GET /products/{id}
  // ==========================================================

  getProduct: async (
    productId,
    token
  ) => {

    const response =
      await authenticatedFetch(
        `${API_URL}/products/${productId}`,
        {
          method: "GET",
        }
      );


    return parseResponse(
      response
    );

  },


  // ==========================================================
  // ADD TO CART
  // POST /cart
  // ==========================================================

  addToCart: async (
    productId,
    quantity,
    token
  ) => {

    const response =
      await authenticatedFetch(
        `${API_URL}/cart`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              product_id:
                productId,

              quantity:
                quantity,
            }),
        }
      );


    return parseResponse(
      response
    );

  },


  // ==========================================================
  // GET CART
  // GET /cart
  // ==========================================================

  getCart: async (
    token
  ) => {

    const response =
      await authenticatedFetch(
        `${API_URL}/cart`,
        {
          method: "GET",
        }
      );


    return parseResponse(
      response
    );

  },


  // ==========================================================
  // UPDATE CART
  // PUT /cart/{cartId}
  // ==========================================================

  updateCart: async (
    cartId,
    quantity,
    token
  ) => {

    const response =
      await authenticatedFetch(
        `${API_URL}/cart/${cartId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              quantity:
                quantity,
            }),
        }
      );


    return parseResponse(
      response
    );

  },


  // ==========================================================
  // DELETE CART ITEM
  // DELETE /cart/{cartId}
  // ==========================================================

  deleteCart: async (
    cartId,
    token
  ) => {

    const response =
      await authenticatedFetch(
        `${API_URL}/cart/${cartId}`,
        {
          method: "DELETE",
        }
      );


    // 204 No Content

    if (
      response.status === 204
    ) {

      return true;

    }


    return parseResponse(
      response
    );

  },


  // ==========================================================
  // CREATE CHECKOUT
  // POST /checkout
  // ==========================================================

  createCheckout: async (
    token
  ) => {

    const response =
      await authenticatedFetch(
        `${API_URL}/checkout`,
        {
          method: "POST",
        }
      );


    return parseResponse(
      response
    );

  },


  // ==========================================================
  // CREATE ORDER
  // POST /orders
  // ==========================================================

  createOrder: async (
    paymentMethod,
    token
  ) => {

    const response =
      await authenticatedFetch(
        `${API_URL}/orders`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              payment_method:
                paymentMethod,
            }),
        }
      );


    return parseResponse(
      response
    );

  },


  // ==========================================================
  // GET MY ORDERS
  // GET /orders
  // ==========================================================

  getOrders: async (
    token
  ) => {

    const response =
      await authenticatedFetch(
        `${API_URL}/orders`,
        {
          method: "GET",
        }
      );


    return parseResponse(
      response
    );

  },


  // ==========================================================
  // GET ORDER BY ID
  // GET /orders/{orderId}
  // ==========================================================

  getOrder: async (
    orderId,
    token
  ) => {

    const response =
      await authenticatedFetch(
        `${API_URL}/orders/${orderId}`,
        {
          method: "GET",
        }
      );


    return parseResponse(
      response
    );

  },


  // ==========================================================
  // CREATE PAYMENT ORDER
  // POST /payments/create/{orderId}
  // ==========================================================

  createPaymentOrder: async (
    orderId,
    token
  ) => {

    const response =
      await authenticatedFetch(
        `${API_URL}/payments/create/${orderId}`,
        {
          method: "POST",
        }
      );


    return parseResponse(
      response
    );

  },


  // ==========================================================
  // VERIFY PAYMENT
  // POST /payments/verify
  // ==========================================================

  verifyPayment: async (
    paymentData,
    token
  ) => {

    const response =
      await authenticatedFetch(
        `${API_URL}/payments/verify`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              paymentData
            ),
        }
      );


    return parseResponse(
      response
    );

  },


  // ==========================================================
  // GET PAYMENT BY ORDER
  // GET /payments/order/{orderId}
  // ==========================================================

  getPayment: async (
    orderId,
    token
  ) => {

    const response =
      await authenticatedFetch(
        `${API_URL}/payments/order/${orderId}`,
        {
          method: "GET",
        }
      );


    return parseResponse(
      response
    );

  },


  // ==========================================================
  // GET NOTIFICATIONS
  // GET /notifications
  // ==========================================================

  getNotifications: async (
    token
  ) => {

    const response =
      await authenticatedFetch(
        `${API_URL}/notifications`,
        {
          method: "GET",
        }
      );


    return parseResponse(
      response
    );

  },


  // ==========================================================
  // MARK NOTIFICATION AS READ
  // POST /notifications/read
  // ==========================================================

  markNotificationRead: async (
    notificationId,
    token
  ) => {

    const response =
      await authenticatedFetch(
        `${API_URL}/notifications/read`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              notification_id:
                notificationId,
            }),

        }
      );


    return parseResponse(
      response
    );

  },

};