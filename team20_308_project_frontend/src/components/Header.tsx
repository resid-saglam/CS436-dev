import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Header.css";
import LoginPopup from "./LoginPopup";
import { useAuth } from "../context/AuthContext";
import { fetchCategories } from "../services/categoryService";
import { useWishlist } from "../context/WishlistContext";
import {
  Laptop2,
  Monitor,
  Smartphone,
  TabletSmartphone,
  Watch,
  Tv,
  Gamepad2,
  Headphones,
  Camera,
  Bot,
  Server,
  Printer,
  Speaker,
  Mouse,
  Keyboard,
  Tag,
  Heart,
} from "lucide-react";

/* ---------- Type ---------- */
interface Category {
  id: number;
  name: string;
  icon: string;
}

/* ---------- icon string → Lucide component ---------- */
const iconComponentMap: Record<string, React.FC<{ className?: string }>> = {
  laptop: Laptop2,
  monitor: Monitor,
  phone: Smartphone,
  tablet: TabletSmartphone,
  watch: Watch,
  tv: Tv,
  gamepad: Gamepad2,
  headphones: Headphones,
  camera: Camera,
  robot: Bot,
  server: Server,
  printer: Printer,
  speaker: Speaker,
  mouse: Mouse,
  keyboard: Keyboard,
  tag: Tag, // fallback
};

const Header: React.FC = () => {
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [searchTerm, setSearchTerm]         = useState("");
  const [categories, setCategories]         = useState<Category[]>([]);
  const navigate                            = useNavigate();

  const { isLoggedIn, role }                = useAuth();
  const { wishlist }                        = useWishlist();



  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
  }, []);


  /* ---------- Handlers ---------- */
  const handleAccountClick = () => {
    isLoggedIn ? navigate("/profile") : setShowLoginPopup(true);
  };

  const handleSearch = () => {
    const term = searchTerm.trim();
    navigate(term ? `/search?query=${encodeURIComponent(term)}` : "/");
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  if (role === "sales_manager") return null;
  /* ---------- Render ---------- */
  return (
      <>
        <div className="header-top-line" />
        <header className="header">
          {/* Logo */}
          <div className="logo" onClick={() => navigate("/")}>
            <div className="logo-circle"><span className="logo-text">T</span></div>
            <h1 className="logo-title">TechPoint</h1>
          </div>

          {/* Search */}
          <div className="search-wrapper">
            <div className="search-bar">
              <input
                  type="text"
                  placeholder="Search our products..."
                  className="search-bar-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
              />
              <button className="search-bar-button" onClick={handleSearch}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                      d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Account / Wishlist / Basket */}
          <div className="header-icons">
            <button
                className={`icon-button ${window.location.pathname === "/profile" ? "active" : ""}`}
                onClick={handleAccountClick}
            >
              <div className="account-icon" />
              <span className="icon-label">Account</span>
            </button>

            <Link
                to="/wishlist"
                className={`icon-button ${window.location.pathname === "/wishlist" ? "active" : ""}`}
            >
              <div className="wishlist-icon">
                <Heart className="icon" />
                {wishlist.length > 0 && <span className="wishlist-count">{wishlist.length}</span>}
              </div>
              <span className="icon-label">Wishlist</span>
            </Link>

            <Link
                to="/basket"
                className={`icon-button ${window.location.pathname === "/basket" ? "active" : ""}`}
            >
              <div className="cart-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                      d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
                      stroke="#1A1A1A"
                      strokeWidth="2"
                      strokeLinecap="round"
                  />
                  <path
                      d="M3 6h18M16 10a4 4 0 0 1-8 0"
                      stroke="#1A1A1A"
                      strokeWidth="2"
                      strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="icon-label">Basket</span>
            </Link>
          </div>

          {/* Login */}
          {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
        </header>

        {/* Category nav */}
        <div className="header-bottom-line">
          <nav className="category-nav">
            <ul className="category-list">
              <li className="category-item" onClick={() => navigate("/")}>
                <span className="label">All Products</span>
              </li>

              {categories.map((cat) => {
                const IconComp = iconComponentMap[cat.icon] ?? Tag;
                return (
                    <li
                        key={cat.id}
                        className="category-item"
                        onClick={() => navigate(`/?categoryId=${cat.id}`)}
                    >
                      <IconComp className="icon" />
                      <span className="label">{cat.name}</span>
                    </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </>
  );
};

export default Header;
