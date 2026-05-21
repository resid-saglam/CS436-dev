// src/components/ToastPopup.tsx
import React, { useEffect } from "react";
import "../styles/ToastPopup.css";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  onClose: () => void;
}

const ToastPopup: React.FC<ToastProps> = ({
  message,
  type = "info",
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000); // 3 saniye sonra kapanır
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-popup ${type}`}>
      <span>{message}</span>
    </div>
  );
};

export default ToastPopup;
