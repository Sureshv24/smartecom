import { useEffect, useMemo, useState } from "react";
import { api } from "./api";


// ============================================================
// ONLINE PRODUCT IMAGES
// ============================================================

const ONLINE_PRODUCT_IMAGES = {

  "smart watch":
    "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTEwL3JtNTUxLTM3LWFwcGxld2F0Y2gtMzctYl8xLnBuZw.png",

  "fitness band":
    "https://images.unsplash.com/photo-1557935728-e6d1eaabe558?auto=format&fit=crop&w=800&q=80",

  "wireless headphones":
    "https://images.rawpixel.com/image_png_social_square/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI0LTA3L3Jhd3BpeGVsX29mZmljZV8zNF9jbG9zZXVwX3Byb2R1Y3RfcGhvdG9ncmFwaHlfb2ZfYV93aGl0ZV9ibGFua18zY2MwOWUzYy00ZjdkLTQzMTQtOWYwMi1kY2EzOTgzZjBkOGEucG5n.png",

  "bluetooth speaker":
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",

  "gaming headset":
    "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=800&q=80",

  "smartphone":
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",

  "tablet":
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",

  "laptop":
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80",

  "mechanical keyboard":
    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",

  "wireless mouse":
    "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=800&q=80",
};


// ============================================================
// FALLBACK IMAGE
// ============================================================

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=800&q=80";


// ============================================================
// GET PRODUCT IMAGE
// ============================================================

const getProductImage = (product) => {

  const productName =
    (product?.name || "")
      .trim()
      .toLowerCase();


  // ----------------------------------------------------------
  // Product name mapping
  // ----------------------------------------------------------

  if (
    ONLINE_PRODUCT_IMAGES[
      productName
    ]
  ) {
    return ONLINE_PRODUCT_IMAGES[
      productName
    ];
  }


  // ----------------------------------------------------------
  // Backend image URL from array
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
  // Backend image URL from string
  // ----------------------------------------------------------

  if (
    typeof product?.images === "string" &&
    (
      product.images.startsWith("http://") ||
      product.images.startsWith("https://")
    )
  ) {
    return product.images;
  }


  // ----------------------------------------------------------
  // Database filename mapping
  // ----------------------------------------------------------

  const fileName =
    Array.isArray(product?.images)
      ? product.images[0]
      : product?.images;


  if (
    typeof fileName === "string"
  ) {

    const normalized =
      fileName
        .trim()
        .toLowerCase();


    if (
      normalized === "smart-watch.jpg" ||
      normalized === "smartwatch.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "smart watch"
      ];
    }


    if (
      normalized === "headphones.jpg" ||
      normalized === "headphone.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "wireless headphones"
      ];
    }


    if (
      normalized === "speaker.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "bluetooth speaker"
      ];
    }


    if (
      normalized === "smartphone.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "smartphone"
      ];
    }


    if (
      normalized === "laptop.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "laptop"
      ];
    }


    if (
      normalized === "keyboard.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "mechanical keyboard"
      ];
    }


    if (
      normalized === "mouse.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "wireless mouse"
      ];
    }


    if (
      normalized === "fitness-band.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "fitness band"
      ];
    }


    if (
      normalized === "gaming-headset.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "gaming headset"
      ];
    }


    if (
      normalized === "tablet.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "tablet"
      ];
    }

  }


  return FALLBACK_IMAGE;
};


// ============================================================
// STAR DISPLAY
// ============================================================

const renderStars = (
  rating,
  large = false
) => {

  const safeRating =
    Math.max(
      0,
      Math.min(
        5,
        Number(rating) || 0
      )
    );


  return (
    <span
      className={
        large
          ? "review-stars review-stars-large"
          : "review-stars"
      }
      aria-label={`${safeRating} out of 5 stars`}
    >

      {[1, 2, 3, 4, 5].map(
        (star) => (

          <span
            key={star}
            className={
              star <= safeRating
                ? "review-star filled"
                : "review-star"
            }
          >
            ★
          </span>

        )
      )}

    </span>
  );
};


// ============================================================
// FORMAT DATE
// ============================================================

const formatReviewDate = (
  value
) => {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }


  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};


// ============================================================
// PRODUCTS
// ============================================================

function Products({
  showAll = false,
}) {

  const [
    products,
    setProducts,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    message,
    setMessage,
  ] = useState("");


  // ==========================================================
  // SELECTED PRODUCT
  // ==========================================================

  const [
    selectedProduct,
    setSelectedProduct,
  ] = useState(null);


  // ==========================================================
  // REVIEW DATA
  // ==========================================================

  const [
    reviewData,
    setReviewData,
  ] = useState({
    average_rating: 0,
    total_reviews: 0,
    reviews: [],
  });


  const [
    reviewsLoading,
    setReviewsLoading,
  ] = useState(false);


  const [
    reviewsError,
    setReviewsError,
  ] = useState("");


  // ==========================================================
  // REVIEW FORM
  // ==========================================================

  const [
    reviewRating,
    setReviewRating,
  ] = useState(0);


  const [
    reviewComment,
    setReviewComment,
  ] = useState("");


  const [
    reviewSubmitting,
    setReviewSubmitting,
  ] = useState(false);


  const [
    reviewMessage,
    setReviewMessage,
  ] = useState("");


  const [
    showReviewForm,
    setShowReviewForm,
  ] = useState(false);


  // ==========================================================
  // LOAD PRODUCTS
  // ==========================================================

  useEffect(() => {

    let mounted = true;


    const loadProducts =
      async () => {

        try {

          setLoading(true);

          setMessage("");


          // IMPORTANT:
          // api.js handles the stored access token
          // and refresh-token flow.

          const data =
            await api.getProducts();


          if (!mounted) {
            return;
          }


          if (
            Array.isArray(data)
          ) {

            setProducts(data);

          }

          else if (
            Array.isArray(
              data?.products
            )
          ) {

            setProducts(
              data.products
            );

          }

          else {

            setProducts([]);

            setMessage(
              data?.detail ||
              "Unable to load products."
            );
          }

        }

        catch (error) {

          if (!mounted) {
            return;
          }


          console.error(
            "Product error:",
            error
          );


          setProducts([]);


          setMessage(
            error.message ||
            "Unable to load products."
          );

        }

        finally {

          if (mounted) {
            setLoading(false);
          }

        }
      };


    loadProducts();


    return () => {
      mounted = false;
    };

  }, []);


  // ==========================================================
  // LOAD REVIEWS
  // ==========================================================

  const loadReviews =
    async (
      productId
    ) => {

      try {

        setReviewsLoading(true);

        setReviewsError("");


        const data =
          await api.getProductReviews(
            productId
          );


        setReviewData({

          average_rating:
            Number(
              data?.average_rating || 0
            ),

          total_reviews:
            Number(
              data?.total_reviews || 0
            ),

          reviews:
            Array.isArray(
              data?.reviews
            )
              ? data.reviews
              : [],

        });

      }

      catch (error) {

        console.error(
          "Review loading error:",
          error
        );


        setReviewsError(
          error.message ||
          "Unable to load reviews."
        );


        setReviewData({

          average_rating: 0,

          total_reviews: 0,

          reviews: [],

        });

      }

      finally {

        setReviewsLoading(false);
      }

    };


  // ==========================================================
  // OPEN PRODUCT DETAILS
  // ==========================================================

  const openProductDetails =
    async (
      product
    ) => {

      setSelectedProduct(
        product
      );


      setReviewRating(0);

      setReviewComment("");

      setReviewMessage("");

      setReviewsError("");

      setShowReviewForm(
        false
      );


      await loadReviews(
        product.id
      );
    };


  // ==========================================================
  // CLOSE PRODUCT DETAILS
  // ==========================================================

  const closeProductDetails =
    () => {

      setSelectedProduct(
        null
      );


      setReviewData({

        average_rating: 0,

        total_reviews: 0,

        reviews: [],

      });


      setReviewsError("");

      setReviewMessage("");

      setReviewRating(0);

      setReviewComment("");

      setShowReviewForm(
        false
      );

    };


  // ==========================================================
  // ADD TO CART
  // ==========================================================

  const handleAddToCart =
    async (
      product
    ) => {

      try {

        const data =
          await api.addToCart(
            product.id,
            1
          );


        console.log(
          "Cart response:",
          data
        );


        if (
          data?.detail
        ) {

          alert(
            data.detail
          );

        }
        else {

          alert(
            `${product.name} added to cart! ✅`
          );

        }

      }

      catch (error) {

        console.error(
          "Cart error:",
          error
        );


        alert(
          error.message ||
          "Unable to add product to cart."
        );

      }

    };


  // ==========================================================
  // SUBMIT REVIEW
  // ==========================================================

  const handleSubmitReview =
    async (
      event
    ) => {

      event.preventDefault();


      if (!selectedProduct) {
        return;
      }


      if (
        reviewRating < 1 ||
        reviewRating > 5
      ) {

        setReviewMessage(
          "Please select a rating from 1 to 5."
        );

        return;
      }


      try {

        setReviewSubmitting(true);

        setReviewMessage("");


        await api.createReview(
          selectedProduct.id,
          reviewRating,
          reviewComment
        );


        setReviewMessage(
          "Review submitted successfully! ✅"
        );


        setReviewRating(0);

        setReviewComment("");

        setShowReviewForm(
          false
        );


        // Refresh rating and review list
        await loadReviews(
          selectedProduct.id
        );

      }

      catch (error) {

        console.error(
          "Submit review error:",
          error
        );


        setReviewMessage(
          error.message ||
          "Unable to submit review."
        );

      }

      finally {

        setReviewSubmitting(
          false
        );

      }

    };


  // ==========================================================
  // TOP REVIEWS
  // ==========================================================

  const topReviews =
    useMemo(() => {

      return [
        ...reviewData.reviews,
      ]
        .sort(
          (
            first,
            second
          ) => {

            const ratingDifference =
              Number(
                second.rating || 0
              ) -
              Number(
                first.rating || 0
              );


            if (
              ratingDifference !== 0
            ) {
              return ratingDifference;
            }


            const firstDate =
              new Date(
                first.created_at || 0
              ).getTime();


            const secondDate =
              new Date(
                second.created_at || 0
              ).getTime();


            return (
              secondDate -
              firstDate
            );

          }
        )
        .slice(0, 3);

    }, [
      reviewData.reviews,
    ]);


  // ==========================================================
  // VISIBLE PRODUCTS
  // ==========================================================

  const visibleProducts =
    showAll
      ? products
      : products.slice(0, 3);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div className="products-section">

        <p className="loading">
          Loading products...
        </p>

      </div>
    );

  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (message) {

    return (
      <div className="products-section">

        <p className="message">
          {message}
        </p>

      </div>
    );

  }


  // ==========================================================
  // PRODUCT DETAIL PAGE
  // ==========================================================

  if (
    selectedProduct
  ) {

    const imageUrl =
      getProductImage(
        selectedProduct
      );


    return (

      <section className="product-detail-page">

        {/* ==================================================
            BACK
        ================================================== */}

        <div className="product-detail-topbar">

          <button
            type="button"
            className="product-back-btn"
            onClick={
              closeProductDetails
            }
          >
            ← Back to Products
          </button>

        </div>


        {/* ==================================================
            PRODUCT DETAILS
        ================================================== */}

        <div className="product-detail-card">

          <div className="product-detail-image-wrap">

            <img
              src={imageUrl}
              alt={
                selectedProduct.name
              }
              className="product-detail-image"

              onError={(event) => {

                if (
                  event.currentTarget
                    .dataset
                    .fallback !== "true"
                ) {

                  event.currentTarget
                    .dataset
                    .fallback = "true";

                  event.currentTarget.src =
                    FALLBACK_IMAGE;

                }

              }}
            />

          </div>


          <div className="product-detail-info">

            <span className="product-detail-label">
              PRODUCT DETAILS
            </span>


            <h1>
              {selectedProduct.name}
            </h1>


            <p className="product-detail-description">
              {selectedProduct.description ||
                "No description available."}
            </p>


            <div className="product-detail-price">

              ₹
              {Number(
                selectedProduct.price || 0
              ).toLocaleString(
                "en-IN"
              )}

            </div>


            <div className="product-detail-stock">

              Stock:{" "}

              <strong>
                {selectedProduct.stock}
              </strong>

            </div>


            {/* ==================================================
                RATING SUMMARY
            ================================================== */}

            <div className="product-rating-summary">

              {renderStars(
                reviewData.average_rating,
                true
              )}


              <strong>
                {reviewData.average_rating.toFixed(
                  1
                )}
              </strong>


              <span>
                / 5
              </span>


              <span>
                {reviewData.total_reviews}{" "}
                review
                {reviewData.total_reviews !==
                1
                  ? "s"
                  : ""}
              </span>

            </div>


            {/* ==================================================
                ADD TO CART
            ================================================== */}

            <button
              type="button"
              className="detail-add-cart-btn"
              onClick={() =>
                handleAddToCart(
                  selectedProduct
                )
              }
            >
              🛒 Add to Cart
            </button>

          </div>

        </div>


        {/* ==================================================
            REVIEWS AREA
        ================================================== */}

        <div className="product-reviews-section">

          <div className="reviews-section-heading">

            <div>

              <span>
                CUSTOMER FEEDBACK
              </span>

              <h2>
                Reviews & Ratings
              </h2>

            </div>


            <div className="reviews-total-badge">

              {reviewData.total_reviews}{" "}
              Total Reviews

            </div>

          </div>


          {/* ==================================================
              REVIEW MESSAGE
          ================================================== */}

          {reviewMessage && (

            <div
              className={
                reviewMessage.includes(
                  "successfully"
                )
                  ? "review-success-message"
                  : "review-error-message"
              }
            >
              {reviewMessage}
            </div>

          )}


          {/* ==================================================
              REVIEW LOADING
          ================================================== */}

          {reviewsLoading && (

            <div className="reviews-loading">
              Loading reviews...
            </div>

          )}


          {/* ==================================================
              REVIEW ERROR
          ================================================== */}

          {!reviewsLoading &&
            reviewsError && (

              <div className="review-error-message">
                {reviewsError}
              </div>

            )}


          {!reviewsLoading &&
            !reviewsError && (

              <>

                {/* ==================================================
                    TOP REVIEWS
                ================================================== */}

                <div className="top-reviews-block">

                  <div className="top-reviews-title">

                    <span className="top-reviews-icon">
                      🏆
                    </span>

                    <div>

                      <strong>
                        Top Reviews
                      </strong>

                      <p>
                        Highest-rated customer feedback
                      </p>

                    </div>

                  </div>


                  {topReviews.length === 0 ? (

                    <div className="no-reviews-card">

                      <div className="no-reviews-icon">
                        💬
                      </div>

                      <h3>
                        No reviews yet
                      </h3>

                      <p>
                        Be the first customer to review this product.
                      </p>

                    </div>

                  ) : (

                    <div className="reviews-list">

                      {topReviews.map(
                        (
                          review
                        ) => (

                          <article
                            key={
                              review.id
                            }
                            className="review-card"
                          >

                            <div className="review-card-top">

                              <div className="review-customer">

                                <div className="review-avatar">
                                  C
                                </div>

                                <div>

                                  <strong>
                                    Customer #
                                    {review.user_id}
                                  </strong>

                                  <span>
                                    Verified purchase
                                  </span>

                                </div>

                              </div>


                              <time>
                                {formatReviewDate(
                                  review.created_at
                                )}
                              </time>

                            </div>


                            <div className="review-card-rating">

                              {renderStars(
                                review.rating
                              )}

                              <strong>
                                {review.rating}/5
                              </strong>

                            </div>


                            {review.comment && (

                              <p className="review-comment">

                                “
                                {review.comment}
                                ”

                              </p>

                            )}

                          </article>

                        )
                      )}

                    </div>

                  )}

                </div>


                {/* ==================================================
                    ALL REVIEWS
                ================================================== */}

                {reviewData.reviews.length > 0 && (

                  <div className="all-reviews-block">

                    <div className="all-reviews-heading">

                      <h3>
                        All Reviews
                      </h3>

                      <span>
                        {reviewData.total_reviews}{" "}
                        review
                        {reviewData.total_reviews !==
                        1
                          ? "s"
                          : ""}
                      </span>

                    </div>


                    <div className="reviews-list">

                      {reviewData.reviews.map(
                        (
                          review
                        ) => (

                          <article
                            key={
                              `all-${review.id}`
                            }
                            className="review-card"
                          >

                            <div className="review-card-top">

                              <div className="review-customer">

                                <div className="review-avatar">
                                  C
                                </div>

                                <div>

                                  <strong>
                                    Customer #
                                    {review.user_id}
                                  </strong>

                                  <span>
                                    Verified purchase
                                  </span>

                                </div>

                              </div>


                              <time>
                                {formatReviewDate(
                                  review.created_at
                                )}
                              </time>

                            </div>


                            <div className="review-card-rating">

                              {renderStars(
                                review.rating
                              )}

                              <strong>
                                {review.rating}/5
                              </strong>

                            </div>


                            {review.comment && (

                              <p className="review-comment">

                                “
                                {review.comment}
                                ”

                              </p>

                            )}

                          </article>

                        )
                      )}

                    </div>

                  </div>

                )}


                {/* ==================================================
                    WRITE REVIEW
                ================================================== */}

                <div className="write-review-card">

                  <div className="write-review-header">

                    <div>

                      <span>
                        YOUR EXPERIENCE
                      </span>

                      <h3>
                        Write a Review
                      </h3>

                    </div>


                    <button
                      type="button"
                      className="toggle-review-btn"

                      onClick={() =>
                        setShowReviewForm(
                          (
                            current
                          ) =>
                            !current
                        )
                      }
                    >
                      {showReviewForm
                        ? "Close"
                        : "Write Review"}
                    </button>

                  </div>


                  {showReviewForm && (

                    <form
                      className="review-form"
                      onSubmit={
                        handleSubmitReview
                      }
                    >

                      {/* ==================================================
                          RATING
                      ================================================== */}

                      <label>
                        Your Rating
                      </label>


                      <div className="interactive-stars">

                        {[1, 2, 3, 4, 5].map(
                          (
                            star
                          ) => (

                            <button
                              key={
                                star
                              }
                              type="button"

                              className={
                                star <=
                                reviewRating
                                  ? "interactive-star active"
                                  : "interactive-star"
                              }

                              onClick={() =>
                                setReviewRating(
                                  star
                                )
                              }

                              aria-label={
                                `Rate ${star} out of 5`
                              }
                            >
                              ★
                            </button>

                          )
                        )}

                      </div>


                      {/* ==================================================
                          COMMENT
                      ================================================== */}

                      <label
                        htmlFor="review-comment"
                      >
                        Your Review
                      </label>


                      <textarea
                        id="review-comment"
                        value={
                          reviewComment
                        }

                        onChange={(
                          event
                        ) =>
                          setReviewComment(
                            event.target.value
                          )
                        }

                        placeholder="Tell other customers about your experience..."
                        rows="5"
                        maxLength="1000"
                      />


                      {/* ==================================================
                          SUBMIT
                      ================================================== */}

                      <button
                        type="submit"
                        className="submit-review-btn"
                        disabled={
                          reviewSubmitting
                        }
                      >
                        {reviewSubmitting
                          ? "Submitting..."
                          : "Submit Review"}
                      </button>

                    </form>

                  )}

                </div>

              </>

            )}

        </div>

      </section>

    );
  }


  // ==========================================================
  // NO PRODUCTS
  // ==========================================================

  if (
    products.length === 0
  ) {

    return (
      <div className="products-section">

        <p className="message">
          No products available.
        </p>

      </div>
    );

  }


  // ==========================================================
  // PRODUCT LIST
  // ==========================================================

  return (

    <section
      className="products-section"
    >

      <div className="products-grid">

        {visibleProducts.map(
          (
            product
          ) => {

            const imageUrl =
              getProductImage(
                product
              );


            return (

              <div
                className="product-card"
                key={product.id}
              >

                {/* ==================================================
                    IMAGE
                ================================================== */}

                <div
                  className="product-image"
                >

                  <img
                    src={imageUrl}
                    alt={product.name}
                    loading="lazy"

                    onError={(event) => {

                      if (
                        event.currentTarget
                          .dataset
                          .fallback !== "true"
                      ) {

                        event.currentTarget
                          .dataset
                          .fallback = "true";

                        event.currentTarget.src =
                          FALLBACK_IMAGE;

                      }

                    }}
                  />

                </div>


                {/* ==================================================
                    PRODUCT INFORMATION
                ================================================== */}

                <div
                  className="product-info"
                >

                  <h3>
                    {product.name}
                  </h3>


                  <p className="description">

                    {product.description ||
                      "No description available"}

                  </p>


                  <p className="price">

                    ₹
                    {Number(
                      product.price || 0
                    ).toLocaleString(
                      "en-IN"
                    )}

                  </p>


                  <p className="stock">

                    Stock:{" "}
                    {product.stock}

                  </p>


                  {product.category && (

                    <p className="stock">

                      Category:{" "}
                      {product.category}

                    </p>

                  )}


                  {product.popularity !==
                    undefined && (

                    <p className="stock">

                      Popularity:{" "}
                      {product.popularity}

                    </p>

                  )}


                  {/* ==================================================
                      VIEW DETAILS
                  ================================================== */}

                  <button
                    type="button"
                    className="view-product-btn"

                    onClick={() =>
                      openProductDetails(
                        product
                      )
                    }
                  >
                    View Details →
                  </button>


                  {/* ==================================================
                      ADD TO CART
                  ================================================== */}

                  <button
                    type="button"
                    className="add-cart-btn"

                    onClick={() =>
                      handleAddToCart(
                        product
                      )
                    }
                  >
                    🛒 Add to Cart
                  </button>

                </div>

              </div>

            );

          }
        )}

      </div>

    </section>

  );
}


export default Products;
