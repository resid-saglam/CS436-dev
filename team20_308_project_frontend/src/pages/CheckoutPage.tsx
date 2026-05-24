import React, { useEffect, useState } from "react";
import "../styles/CheckoutPage.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

interface Address {
  city: string;
  district: string;
  neighborhood: string;
  street: string;
  apartment: string;
  doorNumber: string;
  floor: string;
  zip: string;
  country: string;
}

// ✨ NEW — formats placeholder labels (Zip → ZIP, doorNumber → Door Number, etc.)
const formatPlaceholder = (key: string): string => {
  if (key.toLowerCase() === "zip") return "ZIP"; // special-case
  const withSpaces = key.replace(/([A-Z])/g, " $1"); // camel → words
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
};

const CheckoutPage: React.FC = () => {
  const [address, setAddress] = useState<Address | null>(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [formAddress, setFormAddress] = useState<Address>({
    city: "",
    district: "",
    neighborhood: "",
    street: "",
    apartment: "",
    doorNumber: "",
    floor: "",
    zip: "",
    country: "",
  });
  const [cardInfo, setCardInfo] = useState({
    cardHolder: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const [basketItems, setBasketItems] = useState<any[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchAddress();
    fetchBasket();
  }, []);

  const fetchAddress = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/users/me/address`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (res.data.address) {
        const addr =
          typeof res.data.address === "string"
            ? JSON.parse(res.data.address)
            : res.data.address;

        setAddress(addr);
        setFormAddress(addr);
      } else setEditingAddress(true);
    } catch (err) {
      console.error("Could not load address:", err);
      setError("Could not load address.");
    }
  };

  const fetchBasket = async () => {
    try {
      const res = await axios.get(`${API_BASE}/cart`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const items = res.data || [];
      setBasketItems(items);
      setTotalPrice(
        items.reduce(
          (sum: number, item: any) => sum + item.Product.price * item.quantity,
          0
        )
      );
    } catch (err) {
      console.error("Could not load cart:", err);
      setError("Could not load cart.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSave = async () => {
    for (const key of Object.keys(formAddress) as (keyof Address)[]) {
      if (!formAddress[key]) {
        showToast("Please fill out all address fields.");
        return;
      }
    }
    try {
      const res = await axios.put(
        `${API_BASE}/users/me/address`,
        { address: formAddress },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.status === 200) {
        setAddress(formAddress);
        setEditingAddress(false);
        setFormAddress(formAddress);
        showToast("Address saved successfully.", "success");
      }
    } catch (err: any) {
      console.error("Could not save address:", err);
      showToast(err.response?.data?.message || "Could not save address.");
    }
  };

  const handlePayment = async () => {
    if (
      !cardInfo.cardHolder ||
      !cardInfo.cardNumber ||
      !cardInfo.expiry ||
      !cardInfo.cvc
    ) {
      showToast("Please fill out all payment fields.");
      return;
    }
    if (!address) {
      showToast("Please add your shipping address first.");
      return;
    }
    if (!basketItems.length) {
      showToast("Your cart is empty.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Please log in first.");
      return;
    }
    try {
      const res = await axios.post(
        `${API_BASE}/checkout/pay`,
        {
          cardHolder: cardInfo.cardHolder,
          cardNumber: cardInfo.cardNumber.replace(/\s/g, ""),
          expiry: cardInfo.expiry,
          cvc: cardInfo.cvc,
          shippingAddress: address,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (res.status === 200) {
        showToast("Payment successful! Invoice sent to your email.", "success");
        setBasketItems([]);

        const invoiceRes = await axios.get(
          `${API_BASE}/orders/invoice/${res.data.orderId}`,
          {
            responseType: "blob",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const blob = new Blob([invoiceRes.data], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);
        navigate("/order-success", { state: { invoiceUrl: blobUrl } });
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      showToast(err.response?.data?.message || "Payment failed.", "error");
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 16);
    v = v.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardInfo({ ...cardInfo, cardNumber: v });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2, 4);
    setCardInfo({ ...cardInfo, expiry: v });
  };

  const handleCVCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardInfo({
      ...cardInfo,
      cvc: e.target.value.replace(/\D/g, "").slice(0, 3),
    });
  };

  return (
    <div className="checkout-container">
      {loading ? (
        <div className="loading">Loading…</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : !basketItems.length ? (
        <div className="empty-basket">
          <h2>Your cart is empty</h2>
          <button onClick={() => navigate("/")}>Continue Shopping</button>
        </div>
      ) : (
        <>
          <div className="checkout-left">
            <h2 className="section-title">Shipping Address</h2>
            {editingAddress || !address ? (
              <div className="address-form">
                {Object.keys(formAddress).map((key) => (
                  <input
                    key={key}
                    placeholder={formatPlaceholder(key)} // ✨ USE NEW HELPER
                    value={(formAddress as any)[key]}
                    onChange={(e) =>
                      setFormAddress({ ...formAddress, [key]: e.target.value })
                    }
                  />
                ))}
                <button
                  className="save-address-btn"
                  onClick={handleAddressSave}
                >
                  Save Address
                </button>
              </div>
            ) : (
              <div className="saved-address">
                <p>
                  {address.city}, {address.district}, {address.neighborhood}
                  <br />
                  {address.street}, Apt {address.apartment}, Door{" "}
                  {address.doorNumber}, Floor {address.floor}
                  <br />
                  {address.zip} – {address.country}
                </p>
                <button onClick={() => setEditingAddress(true)}>
                  Edit Address
                </button>
              </div>
            )}

            <h2 className="section-title">Payment Details</h2>
            <div className="payment-form">
              <input
                placeholder="Cardholder Name"
                value={cardInfo.cardHolder}
                onChange={(e) =>
                  setCardInfo({ ...cardInfo, cardHolder: e.target.value })
                }
              />
              <input
                placeholder="Card Number"
                value={cardInfo.cardNumber}
                onChange={handleCardNumberChange}
                maxLength={19}
              />
              <input
                placeholder="MM/YY"
                value={cardInfo.expiry}
                onChange={handleExpiryChange}
                maxLength={5}
              />
              <input
                placeholder="CVC"
                value={cardInfo.cvc}
                onChange={handleCVCChange}
                maxLength={3}
                type="password"
              />
            </div>
          </div>

          <div className="checkout-right">
            <h2 className="section-title">Order Summary</h2>
            {basketItems.map((item, idx) => (
              <div key={idx} className="summary-item">
                <span>
                  {item.Product.name} ×{item.quantity}
                </span>
                <span>₺{(item.Product.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <hr />
            <div className="summary-total">
              <strong>Total:</strong> <strong>${totalPrice.toFixed(2)}</strong>
            </div>
            <button className="pay-button" onClick={handlePayment}>
              Complete Payment
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CheckoutPage;
