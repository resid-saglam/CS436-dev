import { useEffect, useState } from "react";
import { fetchProductsBrief, ProductBrief } from "../services/productService";
import "../styles/pmModal.css";

interface Props {
    open: boolean;
    excludeIds: number[];
    title?: string;
    onClose(): void;
    onConfirm(ids: number[]): void;
}

const ProductPickerModal: React.FC<Props> = ({
                                                 open,
                                                 excludeIds,
                                                 title = "Select products",
                                                 onClose,
                                                 onConfirm,
                                             }) => {
    const [products, setProducts] = useState<ProductBrief[]>([]);
    const [selected, setSelected] = useState<number[]>([]);

    useEffect(() => {
        if (open) {
            fetchProductsBrief()
                .then((all) => setProducts(all.filter((p) => !excludeIds.includes(p.id))))
                .catch(console.error);
            setSelected([]);
        }
    }, [open, excludeIds]);

    if (!open) return null;

    const toggle = (id: number) =>
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    return (
        <div className="pm-modal-backdrop">
            <div className="pm-modal" style={{ width: 560 }}>
                <h2>{title}</h2>
                <div className="pm-modal-body">
                    <table className="picker-table">
                        <thead>
                        <tr>
                            <th></th>
                            <th>Product Name</th>
                            <th>Serial Number</th>
                            <th>ID</th>
                        </tr>
                        </thead>
                        <tbody>
                        {products.map((p) => (
                            <tr key={p.id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(p.id)}
                                        onChange={() => toggle(p.id)}
                                    />
                                </td>
                                <td>{p.name}</td>
                                <td>{p.serialNumber}</td>
                                <td>{p.id}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <div className="pm-modal-actions">
                    <button className="pm-btn pm-btn--secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="pm-btn pm-btn--primary"
                        disabled={!selected.length}
                        onClick={() => {
                            onConfirm(selected);
                            onClose();
                        }}
                    >
                        Add {selected.length ? `(${selected.length})` : ""}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductPickerModal;
