// src/pages/ProductPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProductById } from "../services/productService";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import ProductComments from "../components/ProductComments";
import "../styles/ProductPage.css";
import { useWishlist } from "../context/WishlistContext";
import { Heart } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

interface Product {
  id: number;
  name: string;
  model: string;
  serialNumber: string;
  description: string;
  price: number | string;
  imageUrl?: string;
  warrantyStatus: string;
  distributorInfo: string;
  quantityInStocks: number;
}

const ProductPage: React.FC = () => {
  /* ---------------------------------- state --------------------------------- */
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [tempRating, setTempRating] = useState<number>(0);

  const [quantity, setQuantity] = useState<number>(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const { addToCart } = useCart();
  const { addToast } = useToast();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  /* --------------------------- ürün + rating çek ---------------------------- */
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id || isNaN(+id)) {
          setError("Invalid product ID");
          return;
        }
        const p = await fetchProductById(+id);
        if (!p) {
          setError("Product not found");
          return;
        }
        setProduct(p);

        /* ortalama puan */
        const r = await fetch(`${API_BASE}/ratings/${id}`);
        if (r.ok) {
          const { averageRating } = await r.json();
          setAverageRating(averageRating || null);
        }

        /* kullanıcının kendi puanı */
        if (token) {
          const ur = await fetch(
            `${API_BASE}/ratings/user/${id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (ur.ok) {
            const { rating } = await ur.json();
            setUserRating(rating || null);
          }
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, token]);

  /* ----------------------------- rating gönder ------------------------------ */
  const handleStarClick = (star: number) => {
    if (userRating) {
      addToast("You already rated this product.", "info");
      return;
    }
    setTempRating(star);
  };

  const handleRatingSubmit = async () => {
    if (!tempRating) {
      addToast("Please select a rating (1-5).", "warning");
      return;
    }
    if (!token) {
      addToast("Login required to rate.", "error");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: +id!, rating: tempRating }),
      });
      if (res.ok) {
        setUserRating(tempRating);
        addToast("Rating saved.", "success");
      } else {
        const err = await res.json();
        addToast(err.message || "Rating failed.", "error");
      }
    } catch (e) {
      addToast("Error while sending rating.", "error");
    }
  };

  /* ------------------------------ sepete ekle -------------------------------- */
  const handleAddToCart = async () => {
    if (!product) return;
    const priceNum = Number(product.price) || 0;

    try {
      await addToCart(
        {
          id: product.id,
          name: product.name,
          price: priceNum,
          imageUrl: product.imageUrl || "https://via.placeholder.com/100",
        },
        quantity
      );
      setShowSuccess(true);
      if (!isHovering) setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      if (error.message?.includes("Not enough stock")) {
        addToast(
          "You have already added the available stock of this product.",
          "error"
        );
      } else {
        addToast("An unexpected error occurred.", "error");
      }
    }
  };
  const handleAddToWishlist = async () => {
    if (!product) return;
    try {
      await addToWishlist({
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl || "https://via.placeholder.com/100",
      });
      addToast("Added to wishlist", "success");
    } catch {
      addToast("Failed to add to wishlist", "error");
    }
  };

  const handleRemoveFromWishlist = async () => {
    if (!product) return;
    try {
      await removeFromWishlist(product.id);
      addToast("Removed from wishlist", "info");
    } catch {
      addToast("Failed to remove from wishlist", "error");
    }
  };
  const isProductInWishlist = () => {
    return wishlist.some((item) => item.productId === product?.id);
  };
  /* -------------------------------- render ---------------------------------- */
  if (loading)
    return (
      <div className="product-page-container">
        <div className="loading">Loading…</div>
      </div>
    );
  if (error || !product)
    return (
      <div className="product-page-container">
        <div className="error-message">{error || "Product not found."}</div>
      </div>
    );

  const priceNum = Number(product.price) || 0; // 👈 sürekli dönüştürmeyelim
  const outOfStock = product.quantityInStocks <= 0;

  return (
    <div className="product-page-container">
      {/* sepete eklendi uyarısı */}
      {showSuccess && (
        <div
          className="success-popup"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => {
            setIsHovering(false);
            setTimeout(() => setShowSuccess(false), 3000);
          }}
        >
          <div className="success-popup-content">
            <span className="checkmark">✔️</span>
            <span className="message">
              {quantity === 1
                ? "Product added to your cart"
                : "Products added to your cart"}
            </span>
          </div>
          <button
            className="go-to-cart-btn"
            onClick={() => navigate("/basket")}
          >
            Go to Cart
          </button>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      <div className="product-top">
        <div className="product-image">
          <img
            src={product.imageUrl || "https://via.placeholder.com/300"}
            alt={product.name}
            loading="lazy"
          />
        </div>
        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>
          <h2 className="product-model">Model: {product.model}</h2>
          <p className="serial-number">Serial Number: {product.serialNumber}</p>
          <p className="product-description">{product.description}</p>
          <p className="product-price">${priceNum.toFixed(2)}</p>
          <p className="product-warranty">
            <span>Warranty:</span>{" "}
            {+product.warrantyStatus === 1 ? "Yes" : "No"}
          </p>
          <p className="product-distributor">
            <span>Distributor:</span> {product.distributorInfo}
          </p>
          <p className="stock-info">
            <span>Stock:</span>{" "}
            {outOfStock ? "Out of stock" : product.quantityInStocks}
          </p>
          {averageRating !== null && (
            <p className="average-rating">
              <span>⭐ Average Rating:</span> {averageRating} / 5
            </p>
          )}
          {userRating && (
            <p className="user-rating">
              <span>You rated {userRating}</span>
            </p>
          )}
          {!outOfStock && (
            <div className="quantity-selector">
              <label>Qty:&nbsp;</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.min(+e.target.value || 1, product.quantityInStocks)
                  )
                }
                min={1}
                max={product.quantityInStocks}
              />
            </div>
          )}
          <div className="button-group">
            <button
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={outOfStock}
            >
              {outOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
            <button
              onClick={
                isProductInWishlist()
                  ? handleRemoveFromWishlist
                  : handleAddToWishlist
              }
              className={`wishlist-btn ${
                isProductInWishlist() ? "remove" : "add"
              }`}
            >
              <Heart />
              {isProductInWishlist()
                ? "Remove from Wishlist"
                : "Add to Wishlist"}
            </button>
          </div>
        </div>
      </div>

      {/* ---------- rating kutusu ---------- */}
      <div className="interaction-section">
        <div className="rating-box">
          <h3>Rate this product</h3>
          {userRating ? (
            <p>You already rated.</p>
          ) : (
            <>
              <div className="star-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className="star"
                    onClick={() => handleStarClick(star)}
                    title={`${star} star`}
                  >
                    {star <= tempRating ? "★" : "☆"}
                  </span>
                ))}
              </div>
              <button
                className="submit-rating-btn"
                onClick={handleRatingSubmit}
                disabled={!tempRating}
              >
                Submit
              </button>
            </>
          )}
        </div>
      </div>

      {/* ---------- yorum bileşeni ---------- */}
      <section className="product-comments">
        <ProductComments productId={product.id} />
      </section>
    </div>
  );
};

export default ProductPage;
