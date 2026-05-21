import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { Heart, ShoppingCart, Star } from "lucide-react";
import "../styles/ProductCard.css";

interface ProductProps {
  id: number;
  name: string;
  brand?: string;
  model?: string;
  serialNumber: string;
  price: number;
  imageUrl: string;
  averageRating?: number;
  reviewCount?: number;
  quantityInStocks: number;
}

const LOW_STOCK_THRESHOLD = 5;

const ProductCard: React.FC<ProductProps> = ({
  id,
  name,
  brand,
  model,
  price,
  imageUrl,
  averageRating,
  reviewCount,
  quantityInStocks,
}) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const inWishlist = isInWishlist(id);

  const outOfStock = quantityInStocks <= 0;
  const lowStock = !outOfStock && quantityInStocks <= LOW_STOCK_THRESHOLD;
  // Some seed data uses `model`; the legacy field name `brand` is kept for back-compat.
  const subtitle = brand || model || "";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addToCart({ id, name, price, imageUrl: imageUrl! });
    const button = e.currentTarget as HTMLButtonElement;
    const label = button.querySelector(".btn-label");
    if (label) {
      const original = label.textContent;
      label.textContent = "Added!";
      setTimeout(() => {
        label.textContent = original;
      }, 1500);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(id);
    } else {
      addToWishlist({ id, name, price, imageUrl: imageUrl! });
    }
  };

  const handleCardClick = () => {
    navigate(`/product/${id}`);
  };

  let stockBadge: React.ReactNode = null;
  if (outOfStock) {
    stockBadge = <span className="stock-badge stock-badge--out">Out of stock</span>;
  } else if (lowStock) {
    stockBadge = (
      <span className="stock-badge stock-badge--low">
        Only {quantityInStocks} left
      </span>
    );
  } else {
    stockBadge = <span className="stock-badge stock-badge--in">In stock</span>;
  }

  return (
    <div
      className={`product-card ${outOfStock ? "product-card--disabled" : ""}`}
      onClick={handleCardClick}
    >
      <div className="product-image-wrapper">
        <button
          type="button"
          className={`wishlist-btn ${inWishlist ? "wishlist-btn--active" : ""}`}
          onClick={handleWishlistToggle}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className="wishlist-icon" />
        </button>
        {stockBadge}
        <div className="image-wrapper">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.innerHTML =
                  '<span class="placeholder-text">No image available</span>';
              }}
            />
          ) : (
            <span className="placeholder-text">No image available</span>
          )}
        </div>
      </div>
      <div className="product-details">
        <h3 className="product-name" title={name}>{name}</h3>
        {subtitle && <p className="product-brand">{subtitle}</p>}
        {averageRating !== undefined && (
          <div className="rating-container">
            <Star className="rating-star" />
            <span className="rating-value">{averageRating.toFixed(1)}</span>
            {reviewCount !== undefined && (
              <span className="review-count">({reviewCount})</span>
            )}
          </div>
        )}
        <div className="product-footer">
          <p className="product-price">${Number(price).toFixed(2)}</p>
          <button
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={outOfStock}
          >
            <ShoppingCart className="btn-icon" aria-hidden="true" />
            <span className="btn-label">
              {outOfStock ? "Out of stock" : "Add to cart"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
