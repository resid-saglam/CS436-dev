import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPopup.css";
import RegisterPopup from "./RegisterPopup";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

interface LoginPopupProps {
  onClose: () => void;
  redirectTo?: string;
}

const LoginPopup: React.FC<LoginPopupProps> = ({ onClose, redirectTo }) => {
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [loading, setLoading]           = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate                        = useNavigate();
  const { login }                       = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await loginUser(email, password);

      if (res.success) {
        /* 1) LocalStorage güncelle */
        localStorage.setItem("token", res.token);
        localStorage.setItem("name",  res.name || "User");
        localStorage.setItem("role",  res.role);

        /* 2) AuthContext’e ilet */
        login(res.token, res.role);

        /* 3) Popup kapat + yönlendir */
        onClose();

        if (res.role === "product_manager") {
          navigate("/pm");
        } else if (res.role === "sales_manager") {
          navigate("/sales-dashboard"); // 👈 doğru path bu!
        } else if (redirectTo) {
          navigate(redirectTo);
        } else {
          navigate("/");
        }
        
      } else {
        setErrorMessage(res.message || "Login failed!");
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMessage("An error occurred while logging in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (showRegister) return <RegisterPopup onClose={onClose} />;

  return (
      <div className="popup-overlay">
        <div className="popup-container">
          {/* ✖ Close */}
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>

          <div className="popup-header">
            <h2>Sign in</h2>
          </div>

          <div className="popup-content">
            {/* LEFT – form */}
            <div className="login-left">
              {errorMessage && <p className="error-message">{errorMessage}</p>}

              <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
              />
              <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
              />

              <div className="login-extras">
                <div className="remember-me">
                  <input type="checkbox" id="rememberMe" />
                  <label htmlFor="rememberMe">Remember me</label>
                </div>
                <div className="forgot-password">
                  <span>Forgot your password?</span>
                </div>
              </div>

              <button
                  className="sign-in-btn"
                  onClick={handleLogin}
                  disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <p className="no-account">
                Not a member?
                <span
                    className="register-link"
                    onClick={() => setShowRegister(true)}
                >
                Create an account
              </span>
              </p>
            </div>

            {/* RIGHT – info panel */}
            <div className="login-right">
              <h3>Member benefits</h3>
              <ul>
                <li>
                  <strong>Get what you want</strong> – Save items for later.
                </li>
                <li>
                  <strong>Rate & Comment</strong> – Evaluate purchased products.
                </li>
                <li>
                  <strong>Get it easier</strong> – Faster checkout, track orders.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
  );
};

export default LoginPopup;
