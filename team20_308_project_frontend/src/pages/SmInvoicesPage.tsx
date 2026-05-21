import React, { useState } from "react";
import { fetchInvoices, downloadInvoice } from "../services/invoiceService";
import "../styles/SmInvoicesPage.css";

const API_BASE = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/sales`
    : "http://localhost:5002/api/sales";

const SmInvoicesPage: React.FC = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");
  const [invoices, setInvoices]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const handleFetch = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await fetchInvoices(startDate, endDate);
      setInvoices(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch invoices");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (orderId: number) => {
    try {
      await downloadInvoice(orderId);
    } catch {
      alert("Failed to download invoice");
    }
  };

  const handlePrint = async (orderId: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/invoices/download/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const w    = window.open("");
      if (!w) return alert("Popup blocked; allow pop-ups to print.");
      w.document.write(`
        <html><body style="margin:0">
          <iframe src="${url}" frameborder="0"
            style="width:100vw; height:100vh;"
            onload="this.contentWindow.focus(); this.contentWindow.print();">
          </iframe>
        </body></html>
      `);
    } catch {
      alert("Failed to load invoice for printing");
    }
  };

  return (
      <div className="inv-page">
        <h2 className="inv-title">📑 Invoices</h2>

        <div className="inv-controls">
          <div className="inv-control-group">
            <label htmlFor="start">Start</label>
            <input
                id="start"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="inv-control-group">
            <label htmlFor="end">End</label>
            <input
                id="end"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <button
              className="inv-btn inv-btn--primary"
              onClick={handleFetch}
              disabled={loading}
          >
            {loading ? "Loading..." : "Fetch Invoices"}
          </button>
        </div>

        {error && <div className="inv-error">{error}</div>}

        {!loading && invoices.length === 0 && !error && (
            <p>No invoices available for the selected date range.</p>
        )}

        {invoices.length > 0 && (
            <table className="inv-table">
              <thead>
              <tr>
                {["Invoice No", "Date", "Total Price", "Actions"].map(h => (
                    <th key={h}>{h}</th>
                ))}
              </tr>
              </thead>
              <tbody>
              {invoices.map(inv => {
                const price = parseFloat(inv.totalPrice);
                return (
                    <tr key={inv.id}>
                      <td>{inv.id}</td>
                      <td>
                        {new Date(inv.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td>{isNaN(price) ? "-" : `$${price.toFixed(2)}`}</td>
                      <td className="inv-actions">
                        <button
                            className="inv-btn inv-btn--outline"
                            onClick={() => handleDownload(inv.id)}
                        >
                          Download PDF
                        </button>
                        <button
                            className="inv-btn inv-btn--outline"
                            onClick={() => handlePrint(inv.id)}
                        >
                          Print
                        </button>
                      </td>
                    </tr>
                );
              })}
              </tbody>
            </table>
        )}
      </div>
  );
};

export default SmInvoicesPage;
