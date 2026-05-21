// src/pages/PmOrdersPage.tsx
import { useEffect, useState } from "react";
import {
    fetchAllOrders,
    updateOrderStatus,
    getInvoiceBlob,
} from "../services/pmOrderService";
import "../styles/InventoryTable.css";
import "../styles/pmPage.css";

/* ───────────── Tipler ───────────── */
type Address = {
    city?: string;
    district?: string;
    neighborhood?: string;
    street?: string;
    apartment?: string;
    doorNumber?: string;
    floor?: string;
    zip?: string;
    country?: string;
};

interface OrderItem {
    id: number;
    quantity: number;
    product: { id: number; name: string; serialNumber: string; price: number };
}
interface Order {
    id: number;
    createdAt: string;
    status:
        | "processing"
        | "in-transit"
        | "delivered"
        | "cancelled"
        | "refund-requested";
    totalPrice: number;
    customer: { id: number; name: string; email: string };
    items: OrderItem[];
    shippingAddress: Address;
}

/* ───────────── Yardımcı fonksiyonlar ───────────── */
/* ───────────── Yardımcı: adres biçimlendir ───────────── */
const formatAddress = (raw: Address | string | null | undefined): string => {
    if (!raw) return "—";

    // ① String geliyorsa JSON parse et
    let a: Address;
    if (typeof raw === "string") {
        try {
            a = JSON.parse(raw) as Address;
        } catch {
            // Parse edilemezse ham hâliyle döndür
            return raw;
        }
    } else {
        a = raw;
    }

    // ② Normal biçimlendirme
    const line1 = [a.city, a.district, a.neighborhood]
        .filter(Boolean)
        .join(", ");

    const apt  = a.apartment  ? `Apt ${a.apartment}`   : undefined;
    const door = a.doorNumber ? `Door ${a.doorNumber}`  : undefined;
    const flr  = a.floor      ? `Floor ${a.floor}`      : undefined;
    const line2 = [a.street, apt, door, flr]
        .filter(Boolean)
        .join(", ");

    const line3 = [a.zip, a.country].filter(Boolean).join(" – ");

    return [line1, line2, line3].filter(Boolean).join("\n");
};


const prettyStatus = (s: Order["status"]) => {
    switch (s) {
        case "in-transit":
            return "In‑Transit";
        case "refund-requested":
            return "Refund Requested";
        case "cancelled":
            return "Cancelled";
        default:
            return s.charAt(0).toUpperCase() + s.slice(1); // Processing, Delivered
    }
};

const PmOrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setOrders(await fetchAllOrders());
            setLoading(false);
        })();
    }, []);

    const changeStatus = async (o: Order) => {
        const next = o.status === "processing" ? "in-transit" : "delivered";
        await updateOrderStatus(o.id, next as any);
        setOrders((prev) =>
            prev.map((x) => (x.id === o.id ? { ...x, status: next } : x))
        );
    };

    const showInvoice = async (id: number) => {
        try {
            const blob = await getInvoiceBlob(id);
            window.open(URL.createObjectURL(blob), "_blank");
        } catch (e: any) {
            alert(e.message);
        }
    };

    if (loading) return <p>Loading…</p>;

    return (
        <div className="pm-wrapper">
            <h1>Orders</h1>

            <table className="inv-table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Products</th>
                    <th>Total ($)</th>
                    <th>Status</th>
                    <th>Address</th>
                    <th>Invoice</th>
                    <th style={{ textAlign: "center" }}>Action</th>
                </tr>
                </thead>

                <tbody>
                {orders.map((o) => (
                    <tr key={o.id}>
                        <td>{o.id}</td>

                        <td>
                            <strong>{o.customer.name}</strong>
                            <br />
                            <small>{o.customer.email}</small>
                            <br />
                            <small>(customer ID:{o.customer.id})</small>
                        </td>

                        <td>
                            {o.items.map((it) => (
                                <div
                                    key={it.id}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        marginBottom: "10px",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: "bold" }}>{it.product.name}</div>
                                        <div style={{ fontSize: "0.9em", color: "#555" }}>
                                            ({it.product.serialNumber}) (Product ID: {it.product.id})
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            minWidth: "40px",
                                        }}
                                    >
                                        ×{it.quantity}
                                    </div>
                                </div>
                            ))}
                        </td>

                        <td>{(+o.totalPrice).toFixed(2)}</td>

                        {/* Status – okunaklı göster */}
                        <td>{prettyStatus(o.status)}</td>

                        <td style={{ whiteSpace: "pre-wrap" }}>
                            {formatAddress(o.shippingAddress)}
                        </td>

                        {/* Invoice butonu */}
                        <td>
                            <button
                                onClick={() => showInvoice(o.id)}
                                className="pm-btn pm-btn--secondary"
                            >
                                View Invoice
                            </button>
                        </td>

                        {/* Action sütunu */}
                        <td style={{ textAlign: "center" }}>
                            {o.status === "processing" && (
                                <button
                                    onClick={() => changeStatus(o)}
                                    className="pm-btn pm-btn--primary"
                                >
                                    Mark as In-Transit
                                </button>
                            )}

                            {o.status === "in-transit" && (
                                <button
                                    onClick={() => changeStatus(o)}
                                    className="pm-btn pm-btn--primary"
                                >
                                    Mark as Delivered
                                </button>
                            )}

                            {["delivered", "cancelled", "refund-requested"].includes(
                                o.status
                            ) && <strong>{prettyStatus(o.status)}</strong>}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default PmOrdersPage;
