import { useEffect, useState } from "react";
import {
    fetchCategories,
    deleteCategory,
    addProductsToCategory,
    removeProductsFromCategory,
    Category,
} from "../services/categoryService";
import AddCategoryModal from "../components/AddCategoryModal";
import ConfirmModal from "../components/ConfirmModal";
import ProductPickerModal from "../components/ProductPickerModal";
import "../styles/pmPage.css";

const CategoriesPage: React.FC = () => {
    const [cats, setCats] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    const [pickerOpen, setPickerOpen] = useState(false);
    const [targetCatId, setTargetCatId] = useState<number | null>(null);
    const [exclude, setExclude] = useState<number[]>([]);

    const [addModal, setAddModal] = useState(false);
    const [confirmId, setConfirmId] = useState<number | null>(null);

    useEffect(() => {
        reload();
    }, []);

    const reload = async () => {
        setLoading(true);
        setCats(await fetchCategories(true));
        setLoading(false);
    };

    /* --- add products to existing category --- */
    const openPicker = (cat: Category) => {
        setTargetCatId(cat.id);
        setExclude(cat.Products?.map((p) => p.id) ?? []);
        setPickerOpen(true);
    };

    const onPicked = async (ids: number[]) => {
        if (targetCatId) {
            await addProductsToCategory(targetCatId, ids);
            reload();
        }
    };

    /* --- remove product --- */
    const removeProd = async (catId: number, prodId: number) => {
        await removeProductsFromCategory(catId, [prodId]);
        reload();
    };

    /* --- delete category --- */
    const confirmDelete = async () => {
        if (confirmId) {
            await deleteCategory(confirmId);
            setConfirmId(null);
            reload();
        }
    };

    return (
        <div className="pm-wrapper">
            <h1>Categories</h1>

            {/* ---- add category button ---- */}
            <button
                className="pm-btn pm-btn--primary"
                style={{ marginBottom: 20 }}
                onClick={() => setAddModal(true)}
            >
                + New Category
            </button>

            {loading ? (
                <p>Loading…</p>
            ) : (
                <table className="inv-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Category Name</th>
                        <th>Products</th>
                        <th style={{ textAlign: "center" }}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {cats.map((c) => (
                        <tr key={c.id}>
                            <td>{c.id}</td>
                            <td style={{ fontWeight: 600 }}>{c.name}</td>

                            <td>
                                {c.Products && c.Products.length ? (
                                    c.Products.map((p) => (
                                        <div
                                            key={p.id}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                                marginBottom: 4,
                                                fontWeight: 600,
                                            }}
                                        >
                                            <button
                                                className="pm-btn pm-btn--danger mini"
                                                onClick={() => removeProd(c.id, p.id)}
                                                title="Remove from category"
                                            >
                                                ×
                                            </button>
                                            {p.name}
                                            <small style={{ fontWeight: 400 }}>(ID:{p.id})</small>
                                        </div>
                                    ))
                                ) : (
                                    <em>—</em>
                                )}
                            </td>

                            <td style={{ textAlign: "center" }}>
                                <button
                                    className="pm-btn pm-btn--secondary"
                                    onClick={() => openPicker(c)}
                                    style={{ marginRight: 8 }}
                                >
                                    Add Products
                                </button>
                                <button
                                    className="pm-btn pm-btn--danger"
                                    onClick={() => setConfirmId(c.id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {/* modals */}
            <AddCategoryModal
                open={addModal}
                onClose={() => setAddModal(false)}
                onAdded={reload}
            />

            <ProductPickerModal
                open={pickerOpen}
                excludeIds={exclude}
                onClose={() => setPickerOpen(false)}
                onConfirm={onPicked}
            />

            <ConfirmModal
                open={confirmId !== null}
                message="Delete this category?"
                onCancel={() => setConfirmId(null)}
                onConfirm={confirmDelete}
            />
        </div>
    );
};

export default CategoriesPage;
