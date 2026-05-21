// src/components/SearchResultCard.tsx
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { Heart, HeartOff } from "lucide-react";
import "../styles/SearchResultCard.css";

interface Product {
  id: number;
  name: string;
  model: string;
  serialNumber: string;
  price: string;
  imageUrl: string | null;
  rating?: number;
  quantityInStocks: number;
}

const SearchResultCard: React.FC<{ product: Product }> = ({ product }) => {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const outOfStock = product.quantityInStocks <= 0;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.imageUrl!,
    });

    const button = e.currentTarget as HTMLButtonElement;
    button.textContent = "Added!";
    setTimeout(() => {
      button.textContent = "Add to Cart";
    }, 1500);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        imageUrl: product.imageUrl!,
      });
    }
  };

  return (
    <div className="search-card-wrapper">
      <Link to={`/product/${product.id}`} className="search-card">
        <div className="card-image">
          <img
            src={
              product.imageUrl || "https://placehold.co/240x200?text=No+Image"
            }
            alt={product.name}
            onError={(e) =>
              ((e.target as HTMLImageElement).src =
                "https://placehold.co/240x200?text=No+Image")
            }
          />
          {/* Wishlist Button */}
          <button
            className={`wishlist-btn ${inWishlist ? "in-wishlist" : ""}`}
            onClick={handleWishlistToggle}
          >
            {inWishlist ? (
              <HeartOff className="wishlist-icon" />
            ) : (
              <Heart className="wishlist-icon" />
            )}
          </button>
        </div>
        <div className="card-details">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-model">{product.model}</p>
          <p className="product-serial">
            Serial Number: {product.serialNumber}
          </p>
          {product.rating !== undefined && (
            <p className="product-rating">⭐ {product.rating.toFixed(1)} / 5</p>
          )}
          <p className="product-price">${Number(product.price).toFixed(2)}</p>
          {product.quantityInStocks! <= 0 ? (
            <button className="out-of-stock-btn" disabled>
              Out of Stock
            </button>
          ) : (
            <button className="add-to-cart-btn" onClick={handleAddToCart}>
              Add to Cart
            </button>
          )}
        </div>
      </Link>
    </div>
  );
};

export default SearchResultCard;
