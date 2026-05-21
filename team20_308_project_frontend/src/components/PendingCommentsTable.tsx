// src/components/PendingCommentsTable.tsx
import { useEffect, useState } from "react";
import {
  fetchPendingComments,
  approveComment,
  rejectComment,
  PendingComment,
} from "../services/pmCommentService.ts";
import { useToast } from "../context/ToastContext";
import "../styles/InventoryTable.css"; // Mevcut tablo stili
import "../styles/PendingComments.css"; // Yeni stil dosyası

const PendingCommentsTable = () => {
  const [rows, setRows] = useState<PendingComment[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  /* İlk yükle */
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPendingComments();
        setRows(data);
      } catch {
        addToast("Could not load pending comments", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [addToast]);

  const ok = async (id: number) => {
    await approveComment(id);
    setRows((p) => p.filter((r) => r.id !== id));
    addToast("Comment approved", "success");
  };

  const ko = async (id: number) => {
    if (!window.confirm("Reject & delete this comment?")) return;
    await rejectComment(id);
    setRows((p) => p.filter((r) => r.id !== id));
    addToast("Comment rejected", "info");
  };

  if (loading) return <p>Loading…</p>;
  if (rows.length === 0) return <p>No pending comments 🎉</p>;

  return (
    <table className="inv-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Product</th>
          <th>User</th>
          <th>Comment</th>
          <th>Date</th>
          <th style={{ textAlign: "center" }}>Actions</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((c) => (
          <tr key={c.id}>
            <td>{c.id}</td>
            <td>{c.Product?.name}</td>
            <td>
              {c.User?.name}
              <br />
              <small>{c.User?.email}</small>
            </td>
            <td>{c.text}</td>
            <td>{new Date(c.createdAt).toLocaleDateString()}</td>
            <td style={{ textAlign: "center" }}>
              <button
                className="pc-btn pc-btn-approve"
                onClick={() => ok(c.id)}
              >
                ✅
              </button>
              <button className="pc-btn pc-btn-reject" onClick={() => ko(c.id)}>
                🗑️
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PendingCommentsTable;
