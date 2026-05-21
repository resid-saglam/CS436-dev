import { useEffect, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getProfile,
  saveAddress,
  UserProfile,
  Address,
} from "../services/userService";
import "../styles/ProfilePage.css";

const emptyAddress: Address = {
  city: "",
  district: "",
  neighborhood: "",
  street: "",
  apartment: "",
  doorNumber: "",
  floor: "",
  zip: "",
  country: "",
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Address>(emptyAddress);
  const [saving, setSaving] = useState(false);

  /* profil bilgisi çek */
  useEffect(() => {
    getProfile()
        .then(setProfile)
        .catch(() => setError("Profile couldn’t be loaded"));
  }, []);

  /* input değişimi */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  /* adres kaydet */
  const handleSave = () => {
    setSaving(true);
    saveAddress(form)
        .then((addr) =>
            setProfile((p) => (p ? { ...p, address: addr } : p))
        )
        .finally(() => {
          setSaving(false);
          setEditing(false);
        });
  };

  return (
      <div className="profile-wrapper">
        <div className="profile-card">
          {/* Üst kısım */}
          <header className="profile-header">
            <div className="avatar">
              {(profile?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="greeting">
              <h2>Hello, {profile?.name || "User"}!</h2>
              <p>{profile?.email}</p>
              <p>You can manage your account here!</p>
            </div>
          </header>

          {/* Adres */}
          <section className="profile-address">
            <h3>Delivery Address</h3>

            {/* Form görünümü */}
            {editing ? (
                <div className="address-form">
                  {Object.keys(form).map((key) => (
                      <input
                          key={key}
                          name={key}
                          value={(form as any)[key]}
                          placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                          onChange={handleChange}
                      />
                  ))}
                  <div className="address-buttons">
                    <button
                        className="primary-btn"
                        onClick={handleSave}
                        disabled={saving}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                        className="secondary-btn"
                        onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
            ) : (
                <>
                  {profile?.address ? (
                      <>
                        <p>
                          {profile.address.street} St., {profile.address.neighborhood},{" "}
                          Apt {profile.address.apartment}, Floor {profile.address.floor}
                          , No: {profile.address.doorNumber}
                        </p>
                        <p>
                          {profile.address.district}, {profile.address.city},{" "}
                          {profile.address.zip}, {profile.address.country}
                        </p>
                        <button
                            className="secondary-btn small-btn"
                            onClick={() => {
                              setForm(profile.address || emptyAddress);
                              setEditing(true);
                            }}
                        >
                          Edit Address
                        </button>
                      </>
                  ) : (
                      <button
                          className="primary-btn small-btn"
                          onClick={() => {
                            setForm(emptyAddress);
                            setEditing(true);
                          }}
                      >
                        Add Address
                      </button>
                  )}
                </>
            )}
          </section>

          {error && <p style={{ color: "red" }}>{error}</p>}

          {/* Alt butonlar */}
          <section className="profile-actions">
            <button className="primary-btn" onClick={() => navigate("/orders")}>
              Order History
            </button>
            <button className="secondary-btn" onClick={() => {logout(); navigate("/");}}>
              Log Out
            </button>
          </section>
        </div>
      </div>
  );
};

export default ProfilePage;
