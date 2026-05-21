import React, { useState } from "react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import "../styles/WishlistPage.css"; // mevcut stiller
import "../styles/Toast.css";

/* -------------------------------------------------- */
/* Basit toast bileşeni (2 sn sonra kapanır)          */
/* -------------------------------------------------- */
const Toast: React.FC<{ msg: string; onDone: () => void }> = ({
  msg,
  onDone,
}) => {
  React.useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return <div className="toast show">{msg}</div>;
};

/* -------------------------------------------------- */
/* Wishlist Page                                      */
/* -------------------------------------------------- */
const WishlistPage: React.FC = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  /* toast mesajı */
  const [toast, setToast] = useState("");

  const handleAddToCart = async (
    e: React.MouseEvent<HTMLButtonElement>,
    item: { productId: number; name: string; imageUrl: string }
  ) => {
    e.stopPropagation();
    try {
      await addToCart(
        {
          id: item.productId,
          name: item.name,
          imageUrl: item.imageUrl,
          price: 0,
        },
        1
      );
      setToast("Added to cart!");
    } catch {
      setToast("Couldn’t add to cart.");
    }
  };

  return (
    <div className="wishlist-page">
      {/* toast */}
      {toast && <Toast msg={toast} onDone={() => setToast("")} />}

      <h2>My Wishlist</h2>

      {wishlist.length === 0 ? (
        <p>Your wishlist is empty.</p>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((item) => (
            <div
              key={item.productId}
              className="wishlist-item"
              onClick={() => navigate(`/product/${item.productId}`)}
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="wishlist-img"
              />
              <p className="wishlist-name">{item.name}</p>

              <div className="wishlist-buttons">
                <button
                  className="wishlist-addcart"
                  onClick={(e) => handleAddToCart(e, item)}
                >
                  Add to Cart
                </button>

                <button
                  className="wishlist-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWishlist(item.productId);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
