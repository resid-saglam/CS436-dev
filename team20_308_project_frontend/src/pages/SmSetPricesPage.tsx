// src/pages/SmSetPricesPage.tsx
import React, { useEffect, useState } from "react";
import "../styles/SmSetPricesPage.css";
/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface Product {
  id: number;
  name: string;
  model: string;
  price: number | null; // null → henüz fiyatlanmamış
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
const SmSetPricesPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [newPrices, setNewPrices] = useState<Record<number, number | "">>({});
  const [toast, setToast]       = useState<string | null>(null);

  /* --------------------------- fetch products --------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:5002/api/products?includeUnpriced=1", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const raw = await res.json();

        /* price numeric | null                                           */
        const parsed: Product[] = raw.map((p: any) => ({
          ...p,
          price: p.price === null ? null : Number(p.price),
        }));

        /* İstersen fiyatı olmayanları üste al */
        parsed.sort((a, b) => (a.price === null ? -1 : 1));

        setProducts(parsed);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ------------------------------- handlers ------------------------------ */
  const handlePriceChange = (id: number, value: string) => {
    const parsed = parseFloat(value.replace(",", "."));
    setNewPrices((prev) => ({
      ...prev,
      [id]: isNaN(parsed) ? "" : parsed,
    }));
  };

  const savePrice = async (id: number) => {
    const price = newPrices[id];
    if (price === "" || price === undefined || price <= 0) return;

    try {
      const res = await fetch(
        `http://localhost:5002/api/sales/products/${id}/price`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ price }),
        }
      );

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed");
      }

      const { product } = await res.json();

      /* local state güncelle */
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, price } : p))
      );
      setNewPrices((prev) => ({ ...prev, [id]: "" }));
      setToast(`✅ Price updated for ${product.name}`);
    } catch (err: any) {
      console.error(err);
      setToast(`❌ ${err.message}`);
    } finally {
      setTimeout(() => setToast(null), 3000);
    }
  };

  /* ------------------------------ render --------------------------------- */
  if (loading) return <div style={{ padding: 20 }}>Loading…</div>;

  return (
    <>
      <div className="sm-set-prices">
        <h2>🛠 Set Product Prices</h2>
        {toast && <div className="toast-popup">{toast}</div>}

        <div className="sm-card">
          <table className="sm-table">
            <thead>
              <tr>
                <th>Name&nbsp;/&nbsp;Model</th>
                <th>Current&nbsp;Price&nbsp;($)</th>
                <th>New&nbsp;Price</th>
                <th style={{ width: 90 }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {products.map((p) => {
                const isUnpriced = p.price === null;
                const inputValue =
                  newPrices[p.id] !== undefined
                    ? newPrices[p.id]
                    : isUnpriced
                    ? ""
                    : p.price ?? "";

                return (
                  <tr
                    key={p.id}
                    className={isUnpriced ? "missing-price-row" : undefined}
                  >
                    <td>
                      <strong>{p.name}</strong>
                      <br />
                      <span style={{ color: "#555", fontSize: "0.8rem" }}>
                        {p.model}
                      </span>
                    </td>

                    <td>{p.price !== null ? p.price.toFixed(2) : "—"}</td>

                    <td>
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) =>
                          handlePriceChange(p.id, e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <button onClick={() => savePrice(p.id)}>Save</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default SmSetPricesPage;
