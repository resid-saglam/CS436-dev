import React, { useEffect, useState } from "react";
import {
  Product,
  fetchProducts,
  updateProductStock,
  deleteProduct,
} from "../services/productService";
import { useToast } from "../context/ToastContext";
import AddProductModal from "./AddProductModal";
import "../styles/InventoryTable.css";

const MIN_STOCK = 0;
const MAX_STOCK = 9999;

export default function InventoryTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { addToast } = useToast();

  // Fetch inventory
  const load = async () => {
    try {
      setLoading(true);
      const items = await fetchProducts(undefined, undefined, true);
      setProducts(items);
    } catch (e: any) {
      setError(e?.message || "Could not load inventory");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // Optimistic stock adjust
  const changeStock = (id: number, delta: number | null, manual?: number) => {
    setProducts(prev =>
        prev.map(p => {
          if (p.id !== id) return p;
          const raw = manual != null ? manual : (p.quantityInStocks ?? 0) + (delta ?? 0);
          const clamped = Math.max(MIN_STOCK, Math.min(MAX_STOCK, raw));
          return { ...p, quantityInStocks: clamped };
        })
    );
  };

  // Save to server
  const saveStock = async (id: number, stock: number) => {
    if (stock < MIN_STOCK || stock > MAX_STOCK) {
      addToast("Stock must be between 0–9999", "error");
      return;
    }
    const ok = await updateProductStock(id, stock);
    addToast(ok ? "Stock updated" : "Update failed", ok ? "success" : "error");
  };

  // Delete flow
  const openDeleteModal = (id: number) => setDeleteId(id);
  const closeDeleteModal = () => setDeleteId(null);
  const handleDeleteConfirm = async () => {
    if (deleteId == null) return;
    try {
      await deleteProduct(deleteId);
      addToast("Deleted", "success");
      setProducts(p => p.filter(x => x.id !== deleteId));
    } catch {
      addToast("Delete failed", "error");
    } finally {
      closeDeleteModal();
    }
  };

  if (loading) return <div className="inv-loading">Loading inventory…</div>;
  if (error)   return <div className="inv-error">{error}</div>;

  return (
      <div className="inv-wrapper">
        <h1 className="inv-title"></h1>

        <div className="inv-toolbar">
          <button
              className="inv-btn inv-btn-add"
              onClick={() => setShowAdd(true)}
          >
            ＋ Add Product
          </button>
        </div>

        <div className="inv-table-container">
          <table className="inv-table">
            <thead>
            <tr>
              <th>ID</th>
              <th>Name / Model</th>
              <th>Stock</th>
              <th>Price&nbsp;($)</th>
              <th>Actions</th>
            </tr>
            </thead>
            <tbody>
            {products.map(p => {
              const unpriced = !p.price || Number(p.price) === 0;
              return (
                  <tr key={p.id} className={unpriced ? "no-price" : ""}>
                    <td>{p.id}</td>
                    <td>
                      <span className="inv-name">{p.name}</span>
                      {p.model && (
                          <span className="inv-model"> ({p.model})</span>
                      )}
                    </td>
                    <td>
                      <div className="inv-stock-cell">
                        <button
                            className="inv-btn inv-btn-stock"
                            onClick={() => changeStock(p.id, -1)}
                            disabled={(p.quantityInStocks ?? 0) <= MIN_STOCK}
                        >
                          −
                        </button>
                        <input
                            className="inv-stock-input"
                            type="number"
                            min={MIN_STOCK}
                            max={MAX_STOCK}
                            value={p.quantityInStocks ?? 0}
                            onChange={e =>
                                changeStock(p.id, null, Number(e.target.value))
                            }
                        />
                        <button
                            className="inv-btn inv-btn-stock"
                            onClick={() => changeStock(p.id, +1)}
                            disabled={(p.quantityInStocks ?? 0) >= MAX_STOCK}
                        >
                          ＋
                        </button>
                        <button
                            className="inv-btn inv-btn-save"
                            onClick={() =>
                                saveStock(p.id, p.quantityInStocks ?? 0)
                            }
                            title="Save stock"
                        >
                          💾
                        </button>
                      </div>
                    </td>
                    <td>{unpriced ? "—" : Number(p.price).toFixed(2)}</td>
                    <td>
                      <button
                          className="inv-btn inv-btn-del"
                          onClick={() => openDeleteModal(p.id)}
                      >
                        🗑 Delete
                      </button>
                    </td>
                  </tr>
              );
            })}
            </tbody>
          </table>
        </div>

        {showAdd && (
            <AddProductModal
                onClose={() => setShowAdd(false)}
                onCreated={load}
            />
        )}

        {deleteId != null && (
            <div className="inv-modal-backdrop">
              <div className="inv-modal-window">
                <p className="inv-modal-text">
                  Are you sure you want to delete this product?
                </p>
                <div className="inv-modal-actions">
                  <button
                      className="inv-btn inv-btn-cancel"
                      onClick={closeDeleteModal}
                  >
                    Cancel
                  </button>
                  <button
                      className="inv-btn inv-btn-confirm"
                      onClick={handleDeleteConfirm}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}
