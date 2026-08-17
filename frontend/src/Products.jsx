import { useEffect, useState } from "react";
import { api } from "./api";


// ============================================================
// ONLINE PRODUCT IMAGES
// ============================================================

const ONLINE_PRODUCT_IMAGES = {

  // WATCHES
  "smart watch":
    "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTEwL3JtNTUxLTM3LWFwcGxld2F0Y2gtMzctYl8xLnBuZw.png",

  "fitness band":
    "https://images.unsplash.com/photo-1557935728-e6d1eaabe558?auto=format&fit=crop&w=800&q=80",


  // AUDIO
  "wireless headphones":
    "https://images.rawpixel.com/image_png_social_square/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI0LTA3L3Jhd3BpeGVsX29mZmljZV8zNF9jbG9zZXVwX3Byb2R1Y3RfcGhvdG9ncmFwaHlfb2ZfYV93aGl0ZV9ibGFua18zY2MwOWUzYy00ZjdkLTQzMTQtOWYwMi1kY2EzOTgzZjBkOGEucG5n.png",

  "bluetooth speaker":
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",

  "gaming headset":
    "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=800&q=80",


  // ELECTRONICS
  "smartphone":
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",

  "tablet":
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",


  // COMPUTING
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
    ONLINE_PRODUCT_IMAGES[productName]
  ) {
    return ONLINE_PRODUCT_IMAGES[productName];
  }


  // ----------------------------------------------------------
  // Backend image URL
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
// PRODUCTS
// ============================================================

function Products({
  showAll = false
}) {

  const [
    products,
    setProducts
  ] = useState([]);


  const [
    loading,
    setLoading
  ] = useState(true);


  const [
    message,
    setMessage
  ] = useState("");


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
          // Do NOT manually check access_token here.
          // api.js handles the access token and refresh token.

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
  // DISPLAY ONLY 3 OR ALL
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
          (product) => {

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
                          .fallback !==
                        "true"
                      ) {

                        event.currentTarget
                          .dataset
                          .fallback =
                          "true";

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
                      ADD TO CART
                  ================================================== */}

                  <button
                    type="button"

                    onClick={async () => {

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

                        } else {

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

                    }}
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