// src/pages/pmPage.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pmPage.css";

const PmPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pm-page-container">
      <h1 className="pm-title">🛠 Product Manager Panel</h1>

      {/* ───────────────── Inventory ───────────────── */}
      <section className="pm-section">
        <h3>📦 Inventory</h3>
        <ul>
          <li>
            <button onClick={() => navigate("/pm/inventory")}>
              View Inventory
            </button>
          </li>
        </ul>
      </section>

      {/* ───────────────── Comments Approval ───────────────── */}
      <section className="pm-section">
        <h3>📝 Pending Comments</h3>
        <ul>
          <li>
            <button onClick={() => navigate("/pm/comments")}>
              View Pending Comments
            </button>
          </li>
        </ul>
      </section>

      {/* ───────────────── Orders ───────────────── */}
      <section className="pm-section">
        <h3>📑 Orders</h3>
        <ul>
          <li>
            <button onClick={() => navigate("/pm/orders")}>
              Manage Orders
            </button>
          </li>
        </ul>
      </section>

      {/* ───────────────── Categories ───────────────── */}
      <section className="pm-section">
        <h3>📂 Categories</h3>
        <ul>
          <li>
            <button onClick={() => navigate("/pm/categories")}>
              Manage Categories
            </button>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default PmPage;
