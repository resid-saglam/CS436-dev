// src/services/refundService.ts
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/sales`
  : "http://localhost:5002/api/sales";

// Helper to inject the stored JWT token
function authHeader(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Shape of a refund request coming from the API
export interface RefundRequest {
  id: number;
  reason: string;
  status: string;
  createdAt: string;
}

/**
 * Fetch all pending refund requests.
 */
export const fetchRefundRequests = async (): Promise<RefundRequest[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/refunds`, {
      headers: authHeader(),
    });
    const data = response.data;
    // API may return under `orders` or `requests`
    const list = Array.isArray(data.orders)
      ? data.orders
      : Array.isArray(data.requests)
      ? data.requests
      : [];
    return list as RefundRequest[];
  } catch (err: any) {
    console.error(
      "Error fetching refund requests:",
      err.response?.data || err.message
    );
    throw new Error("Failed to fetch refund requests");
  }
};

/**
 * Approve a single refund request by ID.
 */
export const approveRefundRequest = async (refundId: number): Promise<void> => {
  try {
    await axios.put(
      `${API_BASE_URL}/refunds/${refundId}/approve`,
      {},
      { headers: authHeader() }
    );
  } catch (err: any) {
    console.error(
      "Error approving refund request:",
      err.response?.data || err.message
    );
    throw new Error("Failed to approve refund request");
  }
};

/**
 * Disapprove a single refund request by ID.
 */
export const disapproveRefundRequest = async (
  refundId: number
): Promise<void> => {
  try {
    await axios.put(
      `${API_BASE_URL}/refunds/${refundId}/disapprove`,
      {},
      { headers: authHeader() }
    );
  } catch (err: any) {
    console.error(
      "Error disapproving refund request:",
      err.response?.data || err.message
    );
    throw new Error("Failed to disapprove refund request");
  }
};

// Alias exports for SmRefundRequestsPage.tsx
export const approveRequest = approveRefundRequest;
export const rejectRequest = disapproveRefundRequest;
