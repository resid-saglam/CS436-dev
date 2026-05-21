// controllers/productController.js

const { Op, literal } = require("sequelize");
const { Product, Wishlist, User, Category } = require("../models");
const { sendDiscountEmail } = require("../services/emailService");

/* -------------------------------------------------------------
   Helpers
----------------------------------------------------------------*/
const buildSearchClause = (raw) => {
  if (!raw) return {};

  const term        = String(raw).toLowerCase().trim();
  const dashToSpace = term.replace(/-/g, " ").replace(/\s+/g, " ");
  const spaceToDash = term.replace(/\s+/g, "-");

  if (term.length < 2) {
    return { name: { [Op.like]: `${term}%` } };
  }

  return {
    [Op.or]: [
      { name       : { [Op.like]: `%${term}%` } },
      { description: { [Op.like]: `%${term}%` } },
      { model      : { [Op.like]: `%${term}%` } },

      { name       : { [Op.like]: `%${dashToSpace}%` } },
      { description: { [Op.like]: `%${dashToSpace}%` } },
      { model      : { [Op.like]: `%${dashToSpace}%` } },

      { name       : { [Op.like]: `%${spaceToDash}%` } },
      { description: { [Op.like]: `%${spaceToDash}%` } },
      { model      : { [Op.like]: `%${spaceToDash}%` } },
    ],
  };
};

const buildSortClause = (sort, attrsToAdd) => {
  switch (sort) {
    case "priceAsc":
      return [["price", "ASC"]];
    case "priceDesc":
      return [["price", "DESC"]];
    case "popularity": {
      const sql = `(SELECT COALESCE(SUM(oi.quantity),0)
                     FROM OrderItems oi
                     WHERE oi.productId = Product.id)`;
      attrsToAdd.push([literal(sql), "popularity"]);
      return [[literal(sql), "DESC"]];
    }
    case "ratingAsc":
      return [
        [
          literal(
              `(SELECT AVG(r.rating) FROM Ratings r WHERE r.productId = Product.id)`
          ),
          "ASC",
        ],
      ];
    case "ratingDesc":
      return [
        [
          literal(
              `(SELECT AVG(r.rating) FROM Ratings r WHERE r.productId = Product.id)`
          ),
          "DESC",
        ],
      ];
    default:
      return [];
  }
};

/* -------------------------------------------------------------
   GET /api/products
----------------------------------------------------------------*/
exports.getAllProducts = async (req, res) => {
  try {
    const { search, sort, categoryId, includeUnpriced } = req.query;

    // 1) Arama koşulu
    let whereClause = buildSearchClause(search);

    // 2) Fiyat filtresi (sadece fiyatı > 0 olanlar)
    if (!includeUnpriced) {
      whereClause = {
        ...whereClause,
        price: { [Op.gt]: 0 },
      };
    }

    // 3) Sıralama
    const attrsToAdd   = [];
    const orderClause  = buildSortClause(sort, attrsToAdd);

    // 4) Kategori filtreleme
    const includeClause = [
      {
        model     : Category,
        through   : { attributes: [] },
        ...(categoryId
            ? { where: { id: Number(categoryId) }, required: true }
            : {}),
      },
    ];

    // 5) Sorgu
    const products = await Product.findAll({
      where     : whereClause,
      include   : includeClause,
      order     : orderClause,
      attributes: { include: attrsToAdd },
    });

    return res.status(200).json(products);
  } catch (err) {
    console.error("🔥 Ürünleri getirirken hata:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* -------------------------------------------------------------
   POST /api/products  (Product-manager yeni ürün ekler)
----------------------------------------------------------------*/
exports.createProduct = async (req, res) => {
  const {
    name,
    model,
    serialNumber,
    description,
    quantityInStocks,
    cost,
    warrantyStatus,
    distributorInfo,
    categoryIds,
    imageUrl,
  } = req.body;

  if (!name || !model || !serialNumber) {
    return res
        .status(400)
        .json({ message: "Name / Model / Serial No gerekli!" });
  }

  try {
    const newProduct = await Product.create({
      name,
      model,
      serialNumber,
      description,
      quantityInStocks,
      cost ,           // 🟡 FIX — artık sadece gelen cost kullanılıyor
      price         : 0,   // satış müdürü glecek fiyatı belirleyecek
      warrantyStatus,
      distributorInfo,
      imageUrl,
    });

    // Kategori ilişkilendirme
    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      const categories = await Category.findAll({
        where: { id: categoryIds },
      });
      if (categories.length !== categoryIds.length) {
        return res
            .status(400)
            .json({ message: "Bazı kategoriler bulunamadı!" });
      }
      await newProduct.addCategories(categories);
    }

    return res
        .status(201)
        .json({ message: "Ürün eklendi, fiyat bekliyor.", product: newProduct });
  } catch (err) {
    console.error("🔥 Ürün eklerken hata:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* -------------------------------------------------------------
   GET /api/products/category/:categoryId
----------------------------------------------------------------*/
exports.getProductsByCategory = async (req, res) => {
  const { categoryId } = req.params;
  try {
    const category = await Category.findByPk(categoryId, {
      include: Product,
    });
    if (!category) {
      return res.status(404).json({ message: "Kategori bulunamadı!" });
    }
    return res.status(200).json(category.Products);
  } catch (err) {
    console.error("🔥 Kategori ürünleri çekilirken hata:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* -------------------------------------------------------------
   GET /api/products/:productId
----------------------------------------------------------------*/
exports.getProductById = async (req, res) => {
  const { productId } = req.params;
  try {
    const product = await Product.findByPk(productId, {
      include: [
        Category,
        { model: require("../models/productImage"), as: "images" },
      ],
    });
    if (!product) {
      return res.status(404).json({ message: "Ürün bulunamadı!" });
    }
    return res.status(200).json(product);
  } catch (err) {
    console.error("🔥 Ürün detay çekilirken hata:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* -------------------------------------------------------------
   PUT /api/products/:productId
----------------------------------------------------------------*/
exports.updateProduct = async (req, res) => {
  const { productId } = req.params;
  const {
    name,
    model,
    serialNumber,
    description,
    quantityInStocks,
    price,
    warrantyStatus,
    distributorInfo,
    categoryIds,
  } = req.body;

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Ürün bulunamadı!" });
    }

    await product.update({
      name,
      model,
      serialNumber,
      description,
      quantityInStocks,
      price,
      warrantyStatus,
      distributorInfo,
    });

    if (Array.isArray(categoryIds)) {
      const categories = await Category.findAll({
        where: { id: categoryIds },
      });
      if (categories.length !== categoryIds.length) {
        return res
            .status(400)
            .json({ message: "Bazı kategoriler bulunamadı!" });
      }
      await product.setCategories(categories);
    }

    return res
        .status(200)
        .json({ message: "Ürün başarıyla güncellendi!", product });
  } catch (err) {
    console.error("🔥 Ürün güncellenirken hata:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* -------------------------------------------------------------
   DELETE /api/products/:productId
----------------------------------------------------------------*/
exports.deleteProduct = async (req, res) => {
  const { productId } = req.params;
  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Ürün bulunamadı!" });
    }
    await product.destroy();
    return res.status(200).json({ message: "Ürün başarıyla silindi!" });
  } catch (err) {
    console.error("🔥 Ürün silinirken hata:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* -------------------------------------------------------------
   POST /api/products/:productId/categories
----------------------------------------------------------------*/
exports.addProductToCategories = async (req, res) => {
  const { productId } = req.params;
  const { categoryIds } = req.body;

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Ürün bulunamadı!" });
    }

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res
          .status(400)
          .json({ message: "En az bir kategori seçilmelidir!" });
    }

    const categories = await Category.findAll({
      where: { id: categoryIds },
    });
    if (categories.length !== categoryIds.length) {
      return res
          .status(400)
          .json({ message: "Bazı kategoriler bulunamadı!" });
    }

    await product.addCategories(categories);
    return res
        .status(200)
        .json({ message: "Ürün başarıyla kategorilere eklendi!" });
  } catch (err) {
    console.error("🔥 Ürün kategori eklenirken hata:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* -------------------------------------------------------------
   PUT /api/products/:productId/discount
----------------------------------------------------------------*/
exports.updateProductPrice = async (req, res) => {
  try {
    const { productId }     = req.params;
    const { newPrice, discountPercent } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const oldPrice = Number(product.price);
    let finalPrice;

    // 1) Yeni fiyatı hesapla
    if (discountPercent !== undefined) {
      const pct = Number(discountPercent);
      if (isNaN(pct) || pct <= 0 || pct >= 100) {
        return res
            .status(400)
            .json({ message: "discountPercent must be 1-99" });
      }
      finalPrice = +(oldPrice * (1 - pct / 100)).toFixed(2);
    } else if (newPrice !== undefined) {
      finalPrice = Number(newPrice);
      if (isNaN(finalPrice) || finalPrice >= oldPrice) {
        return res
            .status(400)
            .json({ message: "newPrice must be lower than current price" });
      }
    } else {
      return res
          .status(400)
          .json({ message: "Provide newPrice or discountPercent" });
    }

    // 2) Kaydet
    product.price = finalPrice;
    await product.save();

    // 3) Wishlist kullanıcılarına mail — non-blocking
    try {
      const wishlists = await Wishlist.findAll({ where: { productId } });
      const userIds = wishlists.map((w) => w.userId);
      if (userIds.length) {
        const users = await User.findAll({ where: { id: userIds } });
        const emails = users.map((u) => u.email);
        await sendDiscountEmail(
          emails,
          product.name,
          oldPrice.toFixed(2),
          finalPrice.toFixed(2)
        );
      }
    } catch (emailErr) {
      console.error("Discount email failed (non-fatal):", emailErr.message);
    }

    return res.json({
      message: "Price updated",
      product: { id: product.id, oldPrice, newPrice: finalPrice },
    });
  } catch (err) {
    console.error("updateProductPrice error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* -------------------------------------------------------------
   PATCH /api/products/:productId/discount-percent
----------------------------------------------------------------*/
exports.applyDiscountPercent = async (req, res) => {
  const { productId }     = req.params;
  const { discountPercent } = req.body;

  const pct = Number(discountPercent);
  if (isNaN(pct) || pct <= 0 || pct >= 100) {
    return res
        .status(400)
        .json({ message: "Invalid discount percent" });
  }

  const product = await Product.findByPk(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const oldPrice = Number(product.price);
  const newPrice = +(oldPrice * (1 - pct / 100)).toFixed(2);

  product.price = newPrice;
  await product.save();

  return res.json({ product, oldPrice, newPrice });
};
