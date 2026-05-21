// src/pages/OrderHistoryPage.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  cancelOrder as apiCancelOrder,
  requestRefund as apiRequestRefund,
} from "../services/orderService";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/ConfirmModal"; // ← NEW
import "../styles/OrderHistoryPage.css";

/* ───────── helpers ───────── */

function normalizeAddress(raw: unknown): Record<string, string> | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return { raw };
    }
  }
  if (typeof raw === "object") return raw as Record<string, string>;
  return null;
}

function formatAddress(addr: Record<string, string>): string[] {
  if (addr.raw) return [addr.raw];

  const l1 = [addr.city, addr.district, addr.neighborhood]
    .filter(Boolean)
    .join(", ");
  const l2 = [
    addr.street,
    addr.apartment && `Apt ${addr.apartment}`,
    addr.doorNumber && `Door ${addr.doorNumber}`,
    addr.floor && `Floor ${addr.floor}`,
  ]
    .filter(Boolean)
    .join(", ");
  const l3 = [addr.zip, addr.country].filter(Boolean).join(" – ");
  return [l1, l2, l3].filter(Boolean);
}

/* ───────── types ───────── */

interface OrderItem {
  id: number;
  quantity: number;
  product: { name: string; price: number; imageUrl: string };
}

type OrderStatus =
  | "processing"
  | "in-transit"
  | "delivered"
  | "cancelled"
  | "refund-requested";

interface Order {
  id: number;
  createdAt: string;
  totalPrice: number;
  status: OrderStatus;
  userId?: number;

  orderItems?: OrderItem[];
  items?: OrderItem[];
  OrderItems?: OrderItem[];
  shippingAddress?: any;
  shipping_address?: any;
}

const API = "http://localhost:5002/api";

/* ───────────────────────────────────────────────────────────── */

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addToast } = useToast();

  /* ───────── confirmation modal state ───────── */
  const [modal, setModal] = useState<{
    type: "cancel" | "refund";
    orderId: number;
  } | null>(null);

  const closeModal = () => setModal(null);

  /* ───────── fetch orders ───────── */
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Need to login.");

        const { data } = await axios.get(`${API}/orders/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(data);
      } catch (e: any) {
        setError(e.message || "Order history could not be loaded.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ───────── API actions ───────── */
  const performCancel = async (orderId: number) => {
    try {
      const { order } = await apiCancelOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: order.status } : o))
      );
      addToast("Order cancelled", "success");
    } catch (e: any) {
      addToast(e?.response?.data?.message || "Couldn’t cancel order", "error");
    }
  };

  const performRefund = async (orderId: number) => {
    try {
      const { order } = await apiRequestRefund(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: order.status } : o))
      );
      addToast("Refund requested", "success");
    } catch (e: any) {
      addToast(e?.response?.data?.message || "Refund request failed", "error");
    }
  };

  /* ───────── invoice ───────── */
  const openInvoicePDF = async (orderId: number) => {
    try {
      const token = localStorage.getItem("token")!;
      const res = await axios.get(`${API}/orders/invoice/${orderId}`, {
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });
      const url = URL.createObjectURL(
        new Blob([res.data], { type: "application/pdf" })
      );
      window.open(url, "_blank");
    } catch {
      addToast("Error while opening invoice", "error");
    }
  };

  /* ───────── render ───────── */
  if (loading) return <div className="loading">Loading…</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="order-history-page">
      <h2>My Order History</h2>

      {orders.length === 0 ? (
        <p>You don’t have any orders yet.</p>
      ) : (
        orders.map((order) => {
          const items =
            order.orderItems || order.items || order.OrderItems || [];
          const deliveredWithin30 =
            order.status === "delivered" &&
            Date.now() - new Date(order.createdAt).getTime() <=
              30 * 24 * 60 * 60 * 1000;

          const addrObj = normalizeAddress(
            order.shippingAddress ?? order.shipping_address
          );

          return (
            <div className="order-card" key={order.id}>
              <h4>Order #{order.id}</h4>

              <p>
                Date:{" "}
                {new Date(order.createdAt).toLocaleDateString("tr-TR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

              <p className="status">
                Status: <strong>{statusText(order.status)}</strong>
              </p>

              <p>Customer&nbsp;ID: {order.userId ?? "—"}</p>

              <div className="order-items">
                {items.map((it) => (
                  <div key={it.id} className="order-item">
                    <img src={it.product.imageUrl} alt={it.product.name} />
                    <div>
                      <p>{it.product.name}</p>
                      <p>Quantity: {it.quantity}</p>
                      <p>${(it.product.price * it.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="total">
                Total: ${Number(order.totalPrice).toFixed(2)}
              </p>

              {addrObj && (
                <div className="address-block">
                  <strong>Shipping&nbsp;Address:</strong>
                  {formatAddress(addrObj).map((ln) => (
                    <p key={ln} style={{ margin: 0 }}>
                      {ln}
                    </p>
                  ))}
                </div>
              )}

              <div className="order-actions">
                {order.status === "processing" && (
                  <button
                    className="secondary-btn cancel-btn"
                    onClick={() =>
                      setModal({ type: "cancel", orderId: order.id })
                    }
                  >
                    Cancel Order
                  </button>
                )}

                {deliveredWithin30 && (
                  <button
                    className="secondary-btn refund-btn"
                    onClick={() =>
                      setModal({ type: "refund", orderId: order.id })
                    }
                  >
                    Request Refund
                  </button>
                )}

                <button
                  className="invoice-link"
                  onClick={() => openInvoicePDF(order.id)}
                >
                  View Invoice (PDF)
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* ───── modal ───── */}
      <ConfirmModal
        isOpen={modal !== null}
        title={
          modal?.type === "cancel" ? "Cancel this order?" : "Request a refund?"
        }
        message={
          modal?.type === "cancel"
            ? "This action is irreversible. Are you sure you want to cancel the order?"
            : "A refund request will be sent for this order. Proceed?"
        }
        confirmLabel={
          modal?.type === "cancel" ? "Cancel Order" : "Send Request"
        }
        cancelLabel="Close"
        onConfirm={() => {
          if (!modal) return;

          /* close the dialog immediately */
          closeModal();

          /* then perform the server call */
          if (modal.type === "cancel") {
            performCancel(modal.orderId);
          } else {
            performRefund(modal.orderId);
          }
        }}
        onClose={closeModal}
      />
    </div>
  );
};

/* ───────── helpers ───────── */
const statusText = (s: OrderStatus) =>
  ((
    {
      processing: "Processing",
      "in-transit": "In-Transit",
      delivered: "Delivered",
      cancelled: "Cancelled",
      "refund-requested": "Refund Requested",
    } as const
  )[s]);

export default OrderHistoryPage;
