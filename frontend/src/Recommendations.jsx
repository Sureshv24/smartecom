import { useEffect, useState } from "react";
import { api } from "./api";


// ============================================================
// PRODUCT IMAGES
// Uses the same product image URLs already used in Products.jsx
// ============================================================

const PRODUCT_IMAGES = {

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

const getRecommendationImage = (
  product
) => {

  const productName =
    (
      product?.name || ""
    )
      .trim()
      .toLowerCase();


  return (
    PRODUCT_IMAGES[
      productName
    ] ||
    FALLBACK_IMAGE
  );

};


// ============================================================
// STAR DISPLAY
// ============================================================

const renderStars = (
  rating
) => {

  const value = Number(
    rating || 0
  );

  return Array.from(
    { length: 5 },
    (_, index) => (
      <span
        key={index}
        className={
          index < Math.round(value)
            ? "recommendation-star filled"
            : "recommendation-star"
        }
      >
        ★
      </span>
    )
  );

};


// ============================================================
// PRODUCT CARD
// ============================================================

function RecommendationCard({
  product,
}) {

  const averageRating =
    Number(
      product.average_rating || 0
    );


  const totalReviews =
    Number(
      product.total_reviews || 0
    );


  return (
    <div className="recommendation-card">

      {/* ==================================================
          IMAGE
      ================================================== */}

      <div className="recommendation-image-wrap">

        <img
          src={getRecommendationImage(
            product
          )}
          alt={product.name}
          className="recommendation-image"
          loading="lazy"
          onError={(event) => {

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
          CONTENT
      ================================================== */}

      <div className="recommendation-content">

        <span className="recommendation-category">
          {product.category ||
            "Product"}
        </span>


        <h3>
          {product.name}
        </h3>


        <div className="recommendation-rating">

          <div className="recommendation-stars">

            {renderStars(
              averageRating
            )}

          </div>


          <strong>
            {averageRating.toFixed(
              1
            )}
          </strong>


          <span>
            ({totalReviews})
          </span>

        </div>


        <div className="recommendation-bottom">

          <strong className="recommendation-price">

            ₹
            {Number(
              product.price || 0
            ).toLocaleString(
              "en-IN"
            )}

          </strong>


          <span className="recommendation-stock">

            {Number(
              product.stock || 0
            ) > 0
              ? "In Stock"
              : "Out of Stock"}

          </span>

        </div>


        <p className="recommendation-reason">
          {product.reason ||
            "Recommended for you."}
        </p>

      </div>

    </div>
  );

}


// ============================================================
// RECOMMENDATIONS COMPONENT
// ============================================================

function Recommendations({
  userId,
}) {

  const [
    recommendedProducts,
    setRecommendedProducts,
  ] = useState([]);


  const [
    trendingProducts,
    setTrendingProducts,
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
  // LOAD RECOMMENDATIONS
  // ==========================================================

  useEffect(() => {

    let mounted = true;


    const loadRecommendations =
      async () => {

        try {

          setLoading(true);
          setMessage("");


          // --------------------------------------------------
          // TRENDING PRODUCTS
          // --------------------------------------------------

          const trending =
            await api.getTrendingProducts();


          if (!mounted) {
            return;
          }


          if (
            Array.isArray(
              trending?.products
            )
          ) {

            setTrendingProducts(
              trending.products
            );

          }


          // --------------------------------------------------
          // PERSONALIZED RECOMMENDATIONS
          // --------------------------------------------------

          const numericUserId =
            Number(userId);


          if (
            userId !== undefined &&
            userId !== null &&
            Number.isInteger(
              numericUserId
            ) &&
            numericUserId > 0
          ) {

            try {

              const recommendations =
                await api.getRecommendations(
                  numericUserId
                );


              if (!mounted) {
                return;
              }


              if (
                Array.isArray(
                  recommendations?.recommendations
                )
              ) {

                setRecommendedProducts(
                  recommendations.recommendations
                );

              }

            } catch (error) {

              console.warn(
                "Personalized recommendations unavailable:",
                error
              );

            }

          }


        } catch (error) {

          if (!mounted) {
            return;
          }


          console.error(
            "Recommendation error:",
            error
          );


          setMessage(
            error.message ||
            "Unable to load recommendations."
          );


        } finally {

          if (mounted) {

            setLoading(false);

          }

        }

      };


    loadRecommendations();


    return () => {

      mounted = false;

    };

  }, [userId]);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <section className="recommendations-section">

        <div className="recommendations-heading">

          <span>
            SMART SHOPPING
          </span>

          <h2>
            Discover products for you
          </h2>

        </div>


        <div className="recommendations-loading">

          Loading recommendations...

        </div>

      </section>
    );

  }


  return (
    <section className="recommendations-section">


      {/* ======================================================
          PERSONALIZED
      ====================================================== */}

      {recommendedProducts.length > 0 && (

        <>

          <div className="recommendations-heading">

            <div>

              <span>
                JUST FOR YOU
              </span>

              <h2>
                Recommended For You
              </h2>

              <p>
                Products selected based on
                your shopping activity.
              </p>

            </div>

          </div>


          <div className="recommendations-grid">

            {recommendedProducts
              .slice(0, 4)
              .map(
                (product) => (

                  <RecommendationCard
                    key={
                      product.id
                    }
                    product={
                      product
                    }
                  />

                )
              )}

          </div>

        </>

      )}


      {/* ======================================================
          TRENDING
      ====================================================== */}

      {trendingProducts.length > 0 && (

        <>

          <div className="recommendations-heading trending-heading">

            <div>

              <span>
                TRENDING NOW
              </span>

              <h2>
                You May Also Like
              </h2>

              <p>
                Popular products customers
                are checking out right now.
              </p>

            </div>

          </div>


          <div className="recommendations-grid">

            {trendingProducts
              .slice(0, 4)
              .map(
                (product) => (

                  <RecommendationCard
                    key={
                      product.id
                    }
                    product={
                      product
                    }
                  />

                )
              )}

          </div>

        </>

      )}


      {/* ======================================================
          EMPTY
      ====================================================== */}

      {recommendedProducts.length === 0 &&
        trendingProducts.length === 0 && (

          <div className="recommendations-empty">

            <div>
              ✨
            </div>

            <h3>
              No recommendations yet
            </h3>

            <p>
              Keep exploring products and
              we'll personalize suggestions
              for you.
            </p>

          </div>

        )}


      {/* ======================================================
          API MESSAGE
      ====================================================== */}

      {message && (

        <p className="recommendations-message">
          {message}
        </p>

      )}

    </section>
  );

}


export default Recommendations;