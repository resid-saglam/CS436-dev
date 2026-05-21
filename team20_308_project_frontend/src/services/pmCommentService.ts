const API = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

export interface PendingComment {
  id: number;
  text: string;
  createdAt: string;
  User: { id: number; name: string; email: string };
  Product: { id: number; name: string };
}

/* GET /api/admin/comments/pending */
export const fetchPendingComments = (): Promise<PendingComment[]> =>
  fetch(`${API}/pm/comments/pending`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  }).then((r) => r.json());

/* PUT /api/admin/comments/:id/approve */
export const approveComment = (id: number) =>
  fetch(`${API}/pm/comments/${id}/approve`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

/* DELETE /api/admin/comments/:id */
export const rejectComment = (id: number) =>
  fetch(`${API}/pm/comments/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
