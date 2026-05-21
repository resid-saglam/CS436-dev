// src/components/AddProductModal.tsx
import React, { useState } from "react";
import "../styles/Modal.css";
import "../styles/AddProductModal.css";
import { createProduct } from "../services/productService";
import { useToast } from "../context/ToastContext";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

type ProductForm = {
  name: string;
  model: string;
  serialNumber: string;
  description: string;
  quantityInStocks: string;
  warrantyStatus: boolean;
  distributorInfo: string;
  imageUrl: string;
};

const emptyForm: ProductForm = {
  name: "",
  model: "",
  serialNumber: "",
  description: "",
  quantityInStocks: "",
  warrantyStatus: false,
  distributorInfo: "",
  imageUrl: "",
};

const AddProductModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const { addToast } = useToast();
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const save = async () => {
    if (!form.name || !form.model || !form.serialNumber) {
      addToast("Name, Model and Serial No are required.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload: any = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== "")
      );
      if (payload.quantityInStocks !== undefined) {
        payload.quantityInStocks = Number(payload.quantityInStocks);
      }
      await createProduct(payload);
      addToast("Product added (awaiting pricing)", "success");
      onCreated();
      onClose();
    } catch (err: any) {
      addToast(err.message || "Create product failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box add-product-modal">
        <h2>Add Product</h2>
        <div className="modal-grid">
          <input
            name="name"
            placeholder="Name *"
            value={form.name}
            onChange={handleChange}
          />
          <input
            name="model"
            placeholder="Model *"
            value={form.model}
            onChange={handleChange}
          />
          <input
            name="serialNumber"
            placeholder="Serial No *"
            value={form.serialNumber}
            onChange={handleChange}
          />
          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
          />
          <input
            name="quantityInStocks"
            type="number"
            min="0"
            placeholder="Initial Stock"
            value={form.quantityInStocks}
            onChange={handleChange}
          />
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="warrantyStatus"
              checked={form.warrantyStatus}
              onChange={handleChange}
            />
            Under warranty
          </label>
          <input
            name="distributorInfo"
            placeholder="Distributor Info"
            value={form.distributorInfo}
            onChange={handleChange}
          />
          <input
            name="imageUrl"
            placeholder="Image URL"
            value={form.imageUrl}
            onChange={handleChange}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-save" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
