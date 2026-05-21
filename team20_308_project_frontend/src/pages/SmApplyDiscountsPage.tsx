// src/pages/SmApplyDiscountsPage.tsx
import React, { useEffect, useState } from "react";
import { useToast } from "../context/ToastContext";
import { applyDiscountService } from "../services/discountService";
import "../styles/discounts.css";

interface Product {
  id: number;
  name: string;
  model?: string;
  price: number;
}

const SmApplyDiscountsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<{ [id: number]: number | "" }>({});
  const { addToast } = useToast();

  /* ---------- 1) Fetch priced products ---------- */
  useEffect(() => {
    fetch("http://localhost:5002/api/products?includeUnpriced=1", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((data: any[]) =>
        setProducts(
          data
            .filter((p) => +p.price > 0)
            .map((p) => ({
              id: p.id,
              name: p.name,
              model: p.model,
              price: +p.price,
            }))
        )
      )
      .catch((err) => console.error("Product fetch error:", err));
  }, []);

  /* ---------- 2) Apply discount ---------- */
  const applyDiscount = async (prod: Product) => {
    const pct = discounts[prod.id];
    if (pct === "" || pct == null || pct < 1 || pct >= 100) {
      addToast("Enter a discount between 1-99 %", "warning");
      return;
    }

    const newPrice = +((prod.price * (100 - pct)) / 100).toFixed(2);

    try {
      await applyDiscountService(prod.id, newPrice);
      addToast(
        `Discount applied: ${prod.name} → $${newPrice.toFixed(2)}`,
        "success"
      );

      setProducts((ps) =>
        ps.map((p) => (p.id === prod.id ? { ...p, price: newPrice } : p))
      );
      setDiscounts((d) => ({ ...d, [prod.id]: "" }));
    } catch (e: any) {
      addToast(e.message || "Discount failed", "error");
    }
  };

  /* ---------- 3) Render ---------- */
  return (
    <>
      <div className="discount-page">
        <h2 className="page-title">
          <span role="img" aria-label="icon">
            📉
          </span>
          &nbsp;Apply Discount to Products
        </h2>

        <table className="discount-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Model</th>
              <th>Current Price</th>
              <th>Discount&nbsp;%</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => {
              const pct = discounts[p.id];
              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.model || "—"}</td>
                  <td>${p.price.toFixed(2)}</td>
                  <td>
                    <input
                      className="discount-input"
                      type="number"
                      min={1}
                      max={99}
                      value={pct ?? ""}
                      onChange={(e) =>
                        setDiscounts((d) => ({
                          ...d,
                          [p.id]:
                            e.target.value === "" ? "" : Number(e.target.value),
                        }))
                      }
                    />
                  </td>
                  <td>
                    <button
                      className="discount-btn"
                      disabled={pct === "" || pct == null}
                      onClick={() => applyDiscount(p)}
                    >
                      Apply
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default SmApplyDiscountsPage;
