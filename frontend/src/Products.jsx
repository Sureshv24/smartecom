import { useEffect, useState } from "react";
import { api } from "./api";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const token = localStorage.getItem("access_token");

        if (!token) {
          setMessage("Please login first.");
          setLoading(false);
          return;
        }

        const data = await api.getProducts(token);

        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data.products) {
          setProducts(data.products);
        } else {
          setMessage(data.detail || "Unable to load products.");
        }
      } catch (error) {
        console.error("Product error:", error);
        setMessage("Unable to connect to product API.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  if (loading) {
    return <p className="loading">Loading products...</p>;
  }

  if (message) {
    return <p className="message">{message}</p>;
  }

  return (
    <section className="products-section">
      <h2>Our Products</h2>

      {products.length === 0 ? (
        <p className="message">No products available.</p>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div className="product-card" key={product.id}>
              
              <div className="product-image">
                {product.images ? (
                  <img
                    src={
                      Array.isArray(product.images)
                        ? product.images[0]
                        : product.images
                    }
                    alt={product.name}
                  />
                ) : (
                  <span>No Image</span>
                )}
              </div>

              <div className="product-info">
                <h3>{product.name}</h3>

                <p className="description">
                  {product.description || "No description available"}
                </p>

                <p className="price">
                  ₹{product.price}
                </p>

                <p className="stock">
                  Stock: {product.stock}
                </p>

                <button
    onClick={async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("Please login first.");
            return;
        }

        try {
            const data = await api.addToCart(
                product.id,
                1,
                token
            );

            console.log("Cart response:", data);

            if (data.detail) {
                alert(data.detail);
            } else {
                alert("Product added to cart! ✅");
            }
        } catch (error) {
            console.error("Cart error:", error);
            alert("Unable to add product to cart.");
        }
    }}
>
    Add to Cart
</button>
              </div>

            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Products;