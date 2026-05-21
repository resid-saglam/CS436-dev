// src/pages/SmRefundRequestsPage.tsx
import React, { useEffect, useState } from "react";
import {
  fetchRefundRequests,
  approveRefundRequest,
  disapproveRefundRequest,
  RefundRequest,
} from "../services/refundService";
import { useToast } from "../context/ToastContext";
import "../styles/InventoryTable.css";
import "../styles/Modal.css";
import "../styles/smPage.css"; // buton stilleri burada

const SmRefundRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmData, setConfirmData] = useState<{
    id: number;
    action: "approve" | "reject";
  } | null>(null);
  const { addToast } = useToast();

  /* ---- initial fetch ---- */
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchRefundRequests();
        setRequests(data);
      } catch {
        addToast("Could not load refund requests", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [addToast]);

  const openConfirm = (id: number, action: "approve" | "reject") =>
    setConfirmData({ id, action });
  const closeConfirm = () => setConfirmData(null);

  const handleConfirm = async () => {
    if (!confirmData) return;
    try {
      if (confirmData.action === "approve") {
        await approveRefundRequest(confirmData.id);
        addToast("Refund approved", "success");
      } else {
        await disapproveRefundRequest(confirmData.id);
        addToast("Refund disapproved", "info");
      }
      setRequests((prev) => prev.filter((r) => r.id !== confirmData.id));
    } catch {
      addToast("Action failed", "error");
    } finally {
      closeConfirm();
    }
  };

  return (
    <div className="sm-page-container wide">
      <h1 className="sm-title">↩️ Refund Requests</h1>

      {loading ? (
        <p>Loading…</p>
      ) : requests.length === 0 ? (
        <p>No refund requests 🎉</p>
      ) : (
        <table className="inv-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th style={{ textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td style={{ textAlign: "center" }}>
                  <button
                    className="btn-approve"
                    onClick={() => openConfirm(r.id, "approve")}
                  >
                    Approve
                  </button>{" "}
                  <button
                    className="btn-reject"
                    onClick={() => openConfirm(r.id, "reject")}
                  >
                    Disapprove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ─────── Modal Overlay ─────── */}
      {confirmData && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>
              Are you sure you want to{" "}
              {confirmData.action === "approve" ? "approve" : "disapprove"} this
              request?
            </p>
            <div className="modal-actions">
              <button onClick={closeConfirm}>Cancel</button>
              <button onClick={handleConfirm}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmRefundRequestsPage;
