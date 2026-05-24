// src/pages/BasketPage.tsx
import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";
import LoginPopup from "../components/LoginPopup";
import "../styles/BasketPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

interface CartItem {
  id: number;
  quantity: number;
  Product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
  };
}

const BasketPage: React.FC = () => {
  const { removeFromCart } = useCart();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  /* ------------------------------------------------------------------
   *  Yardımcılar
   * -----------------------------------------------------------------*/
  const getOrCreateSessionId = () => {
    let sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2);
      localStorage.setItem("sessionId", sessionId);
    }
    return sessionId;
  };

  const fetchCart = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let url = `${API_BASE}/cart`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        url += `?sessionId=${getOrCreateSessionId()}`;
      }

      const res = await fetch(url, { headers });
      const data = await res.json();
      setCartItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Basket Data could not fetch", err);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (cartItemId: number, productId: number) => {
    try {
      await fetch(`${API_BASE}/cart/${cartItemId}`, {
        method: "DELETE",
      });
      setCartItems((prev) => prev.filter((i) => i.id !== cartItemId));
      removeFromCart(productId);
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  const handleCheckout = () => {
    if (!isLoggedIn) setShowLoginPopup(true);
    else navigate("/checkout");
  };

  /* ------------------------------------------------------------------ */
  return (
    <div className="basket-page">
      <h2 className="basket-title">My Cart</h2>

      {loading ? (
        <p>Loading...</p>
      ) : cartItems.length === 0 ? (
        /* ----------- SEPET BOŞ ----------- */
        <div className="empty-cart-wrapper">
          <p>Time to start shopping!</p>
          <button
            className="continue-shopping-btn"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        /* ----------- SEPET DOLU ----------- */
        <div className="basket-content">
          <div className="basket-left">
            {cartItems.map((item) => (
              <div className="basket-card" key={item.id}>
                <img
                  src={item.Product.imageUrl}
                  alt={item.Product.name}
                  className="basket-img"
                />
                <div className="basket-details">
                  <p className="basket-name">{item.Product.name}</p>
                  <p className="basket-qty">Quantity: {item.quantity}</p>
                  <p className="basket-price">
                    ${(item.Product.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    className="basket-remove"
                    onClick={() => handleRemove(item.id, item.Product.id)}
                  >
                    <FaTrash size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="basket-summary">
            <button className="checkout-button" onClick={handleCheckout}>
              Proceed to Checkout
            </button>

            <div className="summary-item">
              <span>Subtotal</span>
              <span>
                $
                {cartItems
                  .reduce((acc, i) => acc + i.Product.price * i.quantity, 0)
                  .toFixed(2)}
              </span>
            </div>

            <div className="summary-item">
              <span>Shipping</span>
              <span>Free</span>
            </div>

            <div className="summary-total">
              <strong>Estimated Total</strong>
              <strong>
                $
                {cartItems
                  .reduce((acc, i) => acc + i.Product.price * i.quantity, 0)
                  .toFixed(2)}
              </strong>
            </div>

            {/* Continue Shopping – aynı genişlikte buton */}
            <button
              className="checkout-button"
              onClick={() => navigate("/")}
              style={{ marginTop: "16px" }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* ------------ LOGIN POPUP ----------- */}
      {showLoginPopup && (
        <LoginPopup
          redirectTo="/checkout"
          onClose={() => {
            setShowLoginPopup(false);
            if (localStorage.getItem("token")) navigate("/checkout");
          }}
        />
      )}
    </div>
  );
};

export default BasketPage;
