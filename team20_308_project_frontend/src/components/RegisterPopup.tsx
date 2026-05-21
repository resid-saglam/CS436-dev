import React, { useState } from "react";
import "../styles/RegisterPopup.css";
import { registerUser } from "../services/authService";
import LoginPopup from "./LoginPopup";

interface RegisterPopupProps {
  onClose: () => void;
}

const RegisterPopup: React.FC<RegisterPopupProps> = ({ onClose }) => {
  const [showLogin, setShowLogin] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      setResponseMessage(null);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setResponseMessage(null);

    try {
      const response = await registerUser(name, email, password);

      if (response.success) {
        setIsSuccess(true);
        setResponseMessage(response.message);
        setTimeout(() => {
          setShowLogin(true);
        }, 1000);
      } else {
        setIsSuccess(false);
        setErrorMessage(response.message || "Registration failed!");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setIsSuccess(false);
      setErrorMessage("An error occurred while registering. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (showLogin) {
    return <LoginPopup onClose={onClose} />;
  }

  return (
      <div className="popup-overlay">
        <div className="popup-container">
          <button className="close-btn" onClick={onClose}>×</button>
          <h2>Create Account</h2>

          {/* Başarı veya hata mesajları */}
          {responseMessage && (
              <p style={{ color: isSuccess ? "green" : "red" }}>
                {responseMessage}
              </p>
          )}
          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <div className="popup-content1">
            <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button
                className="register-btn"
                onClick={handleRegister}
                disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <p className="terms-text">
              By creating an account, you agree to our{" "}
              <a href="/terms">Terms of Service</a> and{" "}
              <a href="/privacy">Privacy Policy</a>
            </p>

            <p>
              Already have an account?
              <span className="login-link" onClick={() => setShowLogin(true)}>
              Sign in
            </span>
            </p>
          </div>
        </div>
      </div>
  );
};

export default RegisterPopup;
