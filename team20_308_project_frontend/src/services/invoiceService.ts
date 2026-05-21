// src/services/invoiceService.ts
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5002/api";
const SALES_BASE = `${API_BASE_URL}/sales`;

/**
 * localStorage’daki token’ı okuyup
 * Authorization header objesi döner.
 */
function authHeader(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fatura listesini tarih aralığına göre çeker.
 * @returns array of invoice objects
 */
export async function fetchInvoices(
  startDate: string,
  endDate: string
): Promise<any[]> {
  try {
    const response = await axios.get(`${SALES_BASE}/invoices`, {
      params: { startDate, endDate },
      headers: authHeader(),
    });

    const { orders } = response.data;
    if (!Array.isArray(orders)) {
      console.error("Invalid data format:", response.data);
      throw new Error("Invalid invoice data format");
    }

    return orders;
  } catch (err: any) {
    console.error(
      "Error fetching invoices:",
      err.response?.data || err.message
    );
    throw new Error("Failed to fetch invoices");
  }
}

/**
 * Tek bir faturayı PDF olarak indirir.
 */
export async function downloadInvoice(orderId: number): Promise<void> {
  try {
    const response = await axios.get(
      `${SALES_BASE}/invoices/download/${orderId}`,
      {
        responseType: "blob",
        headers: authHeader(),
      }
    );

    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error(
      "Error downloading invoice:",
      err.response?.data || err.message
    );
    throw new Error("Failed to download invoice");
  }
}
