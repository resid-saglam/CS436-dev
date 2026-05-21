import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/pmHeader.css";

const PmHeader: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    return (
        <header className="admin-header">
            <div className="admin-logo" onClick={() => navigate("/pm")}>
                <span className="circle">T</span>
                <span className="title">TechPoint – Product Manager</span>
            </div>

            <nav className="admin-nav">
                <Link to="/pm" className="nav-link">
                    Dashboard
                </Link>
                <Link to="/pm/inventory" className="nav-link">
                    Inventory
                </Link>
                <Link to="/pm/categories" className="nav-link">
                    Categories
                </Link>
                <Link to="/pm/comments" className="nav-link">
                    Comments
                </Link>
                <Link to="/pm/orders" className="nav-link">
                    Orders
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

export default PmHeader;
