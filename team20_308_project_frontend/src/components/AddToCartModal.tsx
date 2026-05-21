// src/components/AddToCartModal.tsx
import React, { useEffect } from "react";
import "../styles/AddToCartModal.css";
import { useNavigate } from "react-router-dom";

interface Props {
  onClose: () => void;
}

const AddToCartModal: React.FC<Props> = ({ onClose }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(onClose, 2500); // Otomatik kapanır
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="add-to-cart-modal">
      <div className="modal-content">
        <span className="check-icon">✔</span>
        <p>Product added to your cart!</p>
        <button onClick={() => navigate("/basket")} className="go-cart-btn">
          Go to Cart
        </button>
      </div>
    </div>
  );
};

export default AddToCartModal;
