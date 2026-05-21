// src/components/SmHeader.tsx

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/SmHeader.css";

const SmHeader: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="admin-header">
      <div className="admin-logo" onClick={() => navigate("/sales-dashboard")}>
        <span className="circle">T</span>
        <span className="title">TechPoint – Sales Manager</span>
      </div>

      <nav className="admin-nav">
        <Link to="/sales-dashboard" className="nav-link">
          Dashboard
        </Link>
        <Link to="/sm/set-prices" className="nav-link">
          Inventory
        </Link>
        <Link to="/sm/apply-discounts" className="nav-link">
          Discounts
        </Link>
        <Link to="/sm/invoices" className="nav-link">
          Invoices
        </Link>
        <Link to="/sm/refund-requests" className="nav-link">
          Refunds
        </Link>
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="nav-link logout"
        >
          Log out
        </button>
      </nav>
    </header>
  );
};

export default SmHeader;
