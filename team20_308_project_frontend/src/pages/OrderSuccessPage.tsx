import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/OrderSuccessPage.css";

const OrderSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { invoiceUrl: string } };

  return (
    <div className="success-wrapper">
      <h1 className="success-title">✅ Payment&nbsp;Successful!</h1>

      {/* subtitle */}
      <p className="success-sub">Your order has been received.</p>

      <div className="success-buttons">
        <a
          className="success-btn primary"
          href={state?.invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          View&nbsp;Invoice
        </a>
        <button className="success-btn outline" onClick={() => navigate("/")}>
          Back&nbsp;to&nbsp;Home
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
