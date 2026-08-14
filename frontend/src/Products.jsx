import { useEffect, useState } from "react";
import { api } from "./api";


// ============================================================
// ONLINE PRODUCT IMAGES
// ============================================================

const ONLINE_PRODUCT_IMAGES = {

  // ----------------------------------------------------------
  // WATCHES
  // ----------------------------------------------------------

  "smart watch":
    "https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIzLTEwL3JtNTUxLTM3LWFwcGxld2F0Y2gtMzctYl8xLnBuZw.png",

  "fitness band":
    "https://images.unsplash.com/photo-1557935728-e6d1eaabe558?auto=format&fit=crop&w=800&q=80",


  // ----------------------------------------------------------
  // AUDIO
  // ----------------------------------------------------------

  "wireless headphones":
    "https://images.rawpixel.com/image_png_social_square/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDI0LTA3L3Jhd3BpeGVsX29mZmljZV8zNF9jbG9zZXVwX3Byb2R1Y3RfcGhvdG9ncmFwaHlfb2ZfYV93aGl0ZV9ibGFua18zY2MwOWUzYy00ZjdkLTQzMTQtOWYwMi1kY2EzOTgzZjBkOGEucG5n.png",

  "bluetooth speaker":
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",

  "gaming headset":
    "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=800&q=80",


  // ----------------------------------------------------------
  // ELECTRONICS
  // ----------------------------------------------------------

  "smartphone":
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80",

  "tablet":
    "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80",


  // ----------------------------------------------------------
  // COMPUTING
  // ----------------------------------------------------------

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
//
// This is only used when a product does not have a known image.
// It is NOT the Smart Watch image.
//

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
  // 1. Match by product name
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
  // 2. Backend image array containing URL
  // ----------------------------------------------------------

  if (
    Array.isArray(
      product?.images
    )
  ) {

    const image =
      product.images[0];

    if (
      image &&
      (
        image.startsWith(
          "http://"
        ) ||
        image.startsWith(
          "https://"
        )
      )
    ) {
      return image;
    }
  }


  // ----------------------------------------------------------
  // 3. Backend image string containing URL
  // ----------------------------------------------------------

  if (
    typeof product?.images ===
      "string" &&
    (
      product.images.startsWith(
        "http://"
      ) ||
      product.images.startsWith(
        "https://"
      )
    )
  ) {
    return product.images;
  }


  // ----------------------------------------------------------
  // 4. Existing database filenames
  // ----------------------------------------------------------

  const fileName =
    Array.isArray(
      product?.images
    )
      ? product.images[0]
      : product?.images;


  if (
    typeof fileName ===
    "string"
  ) {

    const normalizedFileName =
      fileName
        .trim()
        .toLowerCase();


    if (
      normalizedFileName ===
        "smart-watch.jpg" ||
      normalizedFileName ===
        "smartwatch.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "smart watch"
      ];
    }


    if (
      normalizedFileName ===
        "headphones.jpg" ||
      normalizedFileName ===
        "headphone.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "wireless headphones"
      ];
    }


    if (
      normalizedFileName ===
      "speaker.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "bluetooth speaker"
      ];
    }


    if (
      normalizedFileName ===
      "smartphone.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "smartphone"
      ];
    }


    if (
      normalizedFileName ===
      "laptop.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "laptop"
      ];
    }


    if (
      normalizedFileName ===
      "keyboard.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "mechanical keyboard"
      ];
    }


    if (
      normalizedFileName ===
      "mouse.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "wireless mouse"
      ];
    }


    if (
      normalizedFileName ===
      "fitness-band.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "fitness band"
      ];
    }


    if (
      normalizedFileName ===
      "gaming-headset.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "gaming headset"
      ];
    }


    if (
      normalizedFileName ===
      "tablet.jpg"
    ) {
      return ONLINE_PRODUCT_IMAGES[
        "tablet"
      ];
    }
  }


  // ----------------------------------------------------------
  // 5. Final fallback
  // ----------------------------------------------------------

  return FALLBACK_IMAGE;
};


// ============================================================
// PRODUCTS COMPONENT
// ============================================================

function Products() {

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

    const loadProducts =
      async () => {

        try {

          const token =
            localStorage.getItem(
              "access_token"
            );


          if (!token) {

            setMessage(
              "Please login first."
            );

            setLoading(false);

            return;
          }


          const data =
            await api.getProducts(
              token
            );


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

            setMessage(
              data?.detail ||
                "Unable to load products."
            );
          }

        }
        catch (error) {

          console.error(
            "Product error:",
            error
          );


          setMessage(
            error.message ||
              "Unable to connect to product API."
          );

        }
        finally {

          setLoading(false);
        }
      };


    loadProducts();

  }, []);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <p className="loading">
        Loading products...
      </p>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (message) {

    return (
      <p className="message">
        {message}
      </p>
    );
  }


  // ==========================================================
  // PRODUCTS UI
  // ==========================================================

  return (

    <section className="products-section">

      <h2>
        Our Products
      </h2>


      {products.length === 0 ? (

        <p className="message">
          No products available.
        </p>

      ) : (

        <div className="products-grid">

          {products.map(
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
                      PRODUCT IMAGE
                  ================================================== */}

                  <div className="product-image">

                    <img
                      src={imageUrl}
                      alt={product.name}
                      loading="lazy"

                      onError={(
                        event
                      ) => {

                        console.error(
                          "Image failed:",
                          product.name,
                          imageUrl
                        );


                        if (
                          event
                            .currentTarget
                            .dataset
                            .fallback !==
                          "true"
                        ) {

                          event
                            .currentTarget
                            .dataset
                            .fallback =
                            "true";

                          event
                            .currentTarget
                            .src =
                            FALLBACK_IMAGE;
                        }
                      }}
                    />

                  </div>


                  {/* ==================================================
                      PRODUCT INFORMATION
                  ================================================== */}

                  <div className="product-info">

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

                        const token =
                          localStorage.getItem(
                            "access_token"
                          );


                        if (!token) {

                          alert(
                            "Please login first."
                          );

                          return;
                        }


                        try {

                          const data =
                            await api.addToCart(
                              product.id,
                              1,
                              token
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
                        catch (
                          error
                        ) {

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
      )}

    </section>
  );
}


export default Products;