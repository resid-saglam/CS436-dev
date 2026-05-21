import { useEffect, useState } from "react";
import {
    createCategory,
    addProductsToCategory,
} from "../services/categoryService";
import { fetchProductsBrief, ProductBrief } from "../services/productService";
import "../styles/pmModal.css";
import {
    Monitor,
    Laptop2,
    Smartphone,
    TabletSmartphone,
    Watch,
    Tv,
    Gamepad2,
    Headphones,
    Camera,
    Bot,
    Server,
    Printer,
    Speaker,
    Mouse,
    Keyboard,
    Tag,
} from "lucide-react";

interface Props {
    open: boolean;
    onClose(): void;
    onAdded(): void;
}

/* -- ikon havuzu (string → Lucide component) -- */
const icons = [
    { name: "laptop", comp: Laptop2 },
    { name: "monitor", comp: Monitor },
    { name: "phone", comp: Smartphone },
    { name: "tablet", comp: TabletSmartphone },
    { name: "watch", comp: Watch },
    { name: "tv", comp: Tv },
    { name: "gamepad", comp: Gamepad2 },
    { name: "headphones", comp: Headphones },
    { name: "camera", comp: Camera },
    { name: "robot", comp: Bot },
    { name: "server", comp: Server },
    { name: "printer", comp: Printer },
    { name: "speaker", comp: Speaker },
    { name: "mouse", comp: Mouse },
    { name: "keyboard", comp: Keyboard },
    { name: "tag", comp: Tag }, // fallback
];

const AddCategoryModal: React.FC<Props> = ({ open, onClose, onAdded }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [catName, setCatName] = useState("");
    const [icon, setIcon] = useState("tag");

    const [products, setProducts] = useState<ProductBrief[]>([]);
    const [picked, setPicked] = useState<number[]>([]);

    useEffect(() => {
        if (open) {
            fetchProductsBrief().then(setProducts).catch(console.error);
            setCatName("");
            setIcon("tag");
            setPicked([]);
            setStep(1);
        }
    }, [open]);

    if (!open) return null;

    const createAndClose = async () => {
        const { id } = await createCategory(catName.trim(), icon);
        if (picked.length) await addProductsToCategory(id, picked);
        onAdded();
        onClose();
    };

    return (
        <div className="pm-modal-backdrop">
            <div className="pm-modal" style={{ width: 620 }}>
                <h2>Add new category</h2>

                {/* ---------- STEP 1 ---------- */}
                {step === 1 && (
                    <div className="pm-modal-body">
                        <label className="form-label">Category name</label>
                        <input
                            className="form-input"
                            value={catName}
                            onChange={(e) => setCatName(e.target.value)}
                            placeholder="e.g. Smart Home"
                            style={{ width: "100%", marginBottom: 24 }}
                        />

                        <label className="form-label">Pick an icon</label>
                        <div className="icon-grid">
                            {icons.map(({ name, comp: Icon }) => (
                                <button
                                    key={name}
                                    className={
                                        "icon-btn" + (icon === name ? " icon-btn--active" : "")
                                    }
                                    onClick={() => setIcon(name)}
                                >
                                    <Icon size={20} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ---------- STEP 2 ---------- */}
                {step === 2 && (
                    <div className="pm-modal-body">
                        <p style={{ marginBottom: 12, fontWeight: 600 }}>
                            Select initial products <small>(optional)</small>
                        </p>
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
                                            checked={picked.includes(p.id)}
                                            onChange={() =>
                                                setPicked((prev) =>
                                                    prev.includes(p.id)
                                                        ? prev.filter((x) => x !== p.id)
                                                        : [...prev, p.id]
                                                )
                                            }
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
                )}

                {/* ---------- ACTIONS ---------- */}
                <div className="pm-modal-actions center">
                    <button className="pm-btn pm-btn--secondary" onClick={onClose}>
                        Cancel
                    </button>
                    {step === 1 ? (
                        <button
                            className="pm-btn pm-btn--primary"
                            disabled={!catName.trim()}
                            onClick={() => setStep(2)}
                        >
                            Next
                        </button>
                    ) : (
                        <button className="pm-btn pm-btn--primary" onClick={createAndClose}>
                            Create
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddCategoryModal;
