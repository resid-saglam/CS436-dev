// src/services/discountService.ts
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

/**
 * Apply discount by sending the final price
 */
export async function applyDiscountService(
  productId: number,
  newPrice: number // 👈 güncellendi
) {
  const res = await fetch(`${API_BASE}/products/${productId}/discount`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({ newPrice }), // 👈 alan adı değişti
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Discount apply failed");
  }
  return res.json();
}
