// src/pages/SmPage.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/smPage.css";

const SmPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      {/* içerik gövdesi */}
      <div className="sm-page-container">
        <h1 className="sm-title">📊 Sales Manager Panel</h1>

        {/* ───────────────── Product Management ───────────────── */}
        <section className="sm-section">
          <h3>🛠 Product&nbsp;Management</h3>
          <ul>
            <li>
              <button onClick={() => navigate("/sm/set-prices")}>
                Set&nbsp;Product&nbsp;Prices
              </button>
            </li>
            <li>
              <button onClick={() => navigate("/sm/apply-discounts")}>
                Apply&nbsp;Discounts&nbsp;to&nbsp;Products
              </button>
            </li>
          </ul>
        </section>

        {/* ───────────────── Notifications ───────────────── */}
        <section className="sm-section">
          <h3>📢 User&nbsp;Notifications</h3>
          <p className="sm-note">
            Automatically notify users when products in their wishlist are
            discounted.
          </p>
        </section>

        {/* ───────────────── Invoices & Reports ───────────────── */}
        <section className="sm-section">
          <h3>📑 Invoice&nbsp;&amp;&nbsp;Reports</h3>
          <ul>
            <li>
              <button onClick={() => navigate("/sm/invoices")}>
                View&nbsp;&amp;&nbsp;Export&nbsp;Invoices
              </button>
            </li>
            <li>
              <button onClick={() => navigate("/sm/profit-loss")}>
                View&nbsp;Profit&nbsp;/&nbsp;Loss&nbsp;Reports
              </button>
            </li>
          </ul>
        </section>

        {/* ───────────────── Refunds ───────────────── */}
        <section className="sm-section">
          <h3>↩️ Refunds</h3>
          <ul>
            <li>
              <button onClick={() => navigate("/sm/refund-requests")}>
                Evaluate&nbsp;Refund&nbsp;Requests
              </button>
            </li>
          </ul>
        </section>
      </div>
    </>
  );
};

export default SmPage;
