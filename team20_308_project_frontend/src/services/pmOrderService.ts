// src/services/pmOrderService.ts
const API = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

/* TÜM siparişler */
export const fetchAllOrders = () =>
  fetch(`${API}/pm/orders`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  }).then(async (r) => {
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  });

/* Durum güncelle */
export const updateOrderStatus = (id: number, status: string) =>
  fetch(`${API}/pm/orders/${id}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ status }),
  }).then(async (r) => {
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  });

/* PDF al */
export const getInvoiceBlob = (id: number) =>
  fetch(`${API}/orders/invoice/${id}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  }).then((r) => {
    if (!r.ok) throw new Error("Could not download invoice");
    return r.blob();
  });
