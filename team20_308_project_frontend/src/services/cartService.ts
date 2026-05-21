// services/cartService.ts
import axios from "axios";

const API_BASE = "http://localhost:5002/api"; // Backend URL

export const addToCart = async (
  productId: number,
  quantity: number = 1,
  token?: string,
  sessionId?: string
) => {
  // token varsa Authorization header ekle
  const headers: any = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const payload: any = { productId, quantity };
  if (!token && sessionId) {
    payload.sessionId = sessionId;
  }

  const response = await axios.post(`${API_BASE}/cart/add`, payload, { headers });
  return response.data;
};

export const getCart = async (token?: string, sessionId?: string) => {
  const headers: any = {};
  let url = `${API_BASE}/cart`;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (sessionId) {
    // query param
    url += `?sessionId=${sessionId}`;
  }

  const response = await axios.get(url, { headers });
  return response.data;
};

export const mergeCart = async (token: string, sessionId: string) => {
  const headers = { Authorization: `Bearer ${token}` };
  const response = await axios.post(
    `${API_BASE}/cart/merge`,
    { sessionId },
    { headers }
  );
  return response.data;
};
