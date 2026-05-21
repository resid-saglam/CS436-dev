// controllers/categoryController.js
const Category = require("../models/category");
const Product  = require("../models/product");

/* ---------- create ---------- */
exports.createCategory = async (req, res) => {
    try {
        const { name, icon = "tag" } = req.body;
        if (!name) return res.status(400).json({ message: "Name required" });

        const exists = await Category.findOne({ where: { name } });
        if (exists) return res.status(409).json({ message: "Name already used" });

        const category = await Category.create({ name, icon });
        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


/* ---------- list ---------- */
exports.getCategories = async (req, res) => {
    try {
        const include =
            req.query.withProducts === "true"
                ? [{ model: Product, through: { attributes: [] } }]
                : [];
        const categories = await Category.findAll({ include, order: [["id", "ASC"]] });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ---------- delete ---------- */
exports.deleteCategory = async (req, res) => {
    try {
        const cat = await Category.findByPk(req.params.id);
        if (!cat) return res.status(404).json({ message: "Not found" });
        await cat.destroy();
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ---------- addProducts ---------- */
exports.addProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const { productIds } = req.body;
        if (!Array.isArray(productIds) || !productIds.length)
            return res.status(400).json({ message: "productIds[] required" });

        const cat = await Category.findByPk(id);
        if (!cat) return res.status(404).json({ message: "Category not found" });

        const prods = await Product.findAll({ where: { id: productIds } });
        if (prods.length !== productIds.length)
            return res.status(400).json({ message: "Some products missing" });

        await cat.addProducts(prods);
        res.json({ message: "Added" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/* ---------- removeProducts ---------- */
exports.removeProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const { productIds } = req.body;
        if (!Array.isArray(productIds) || !productIds.length)
            return res.status(400).json({ message: "productIds[] required" });

        const cat = await Category.findByPk(id);
        if (!cat) return res.status(404).json({ message: "Category not found" });

        const prods = await Product.findAll({ where: { id: productIds } });
        await cat.removeProducts(prods);
        res.json({ message: "Removed" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
