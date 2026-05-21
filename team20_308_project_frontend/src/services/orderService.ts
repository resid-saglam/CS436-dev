import { apiFetch } from "../api/api";

// ✅ Sipariş İptal Etme
export const cancelOrder = (orderId: number) =>
  apiFetch(`/orders/${orderId}/cancel`, { method: "PUT" });

// ✅ İade Talep Etme
export const requestRefund = (id: number) =>
  apiFetch(`/orders/${id}/refund`, { method: "PUT" });

// ✅ Fatura Listesi Çekme (Tarih Aralığı)
export const fetchInvoices = async (startDate: string, endDate: string) => {
  try {
    const response = await apiFetch(
      `/invoices?startDate=${startDate}&endDate=${endDate}`
    );
    return response.orders;
  } catch (err) {
    console.error("Error fetching invoices:", err);
    throw new Error("Failed to fetch invoices");
  }
};

// ✅ Fatura İndirme (PDF)
export const downloadInvoice = async (orderId: number) => {
  try {
    // Fatura verisini fetch ile çekme
    const response = await fetch(`/api/invoices/download?orderId=${orderId}`);
    if (!response.ok) throw new Error("Failed to download invoice");

    // Yanıtı blob olarak dönüştürme
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // Dosya indirme işlemi
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (err) {
    console.error("Error downloading invoice:", err);
    throw new Error("Failed to download invoice");
  }
};

// ✅ Sipariş Geçmişini Getirme
export const fetchOrderHistory = async () => {
  try {
    const response = await apiFetch(`/orders/history`);
    return response.orders;
  } catch (err) {
    console.error("Error fetching order history:", err);
    throw new Error("Failed to fetch order history");
  }
};

// ✅ Sipariş Detaylarını Getirme
export const getOrderDetails = async (orderId: number) => {
  try {
    const response = await apiFetch(`/orders/${orderId}`);
    return response.order;
  } catch (err) {
    console.error("Error fetching order details:", err);
    throw new Error("Failed to fetch order details");
  }
};

// ✅ Sipariş Oluşturma
export const createOrder = async (orderData: any) => {
  try {
    const response = await apiFetch(`/orders`, {
      method: "POST",
      body: JSON.stringify(orderData),
    });
    return response.order;
  } catch (err) {
    console.error("Error creating order:", err);
    throw new Error("Failed to create order");
  }
};

// ✅ Sipariş Durumunu Güncelleme
export const updateOrderStatus = async (orderId: number, status: string) => {
  try {
    const response = await apiFetch(`/orders/${orderId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    return response.order;
  } catch (err) {
    console.error("Error updating order status:", err);
    throw new Error("Failed to update order status");
  }
};
