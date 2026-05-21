// controllers/cartController.js

const CartItem = require("../models/cartItem");
const Product = require("../models/product");

// Kullanıcı login olsun ya da olmasın, sepete ekleme
// ---------------------------------------------------------------------------
// POST /api/cart/add         – addToCart
// Rejects the request if requested quantity exceeds available stock
// ---------------------------------------------------------------------------
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, sessionId } = req.body;
    const requestedQty = Math.max(1, Number(quantity)); // always ≥ 1

    /* 1) Verify product exists */
    const product = await Product.findByPk(productId);
    if (!product)
      return res.status(404).json({ message: "Product not found." });

    /* 2) Determine the cart owner  */
    const userId = req.user ? req.user.id : null;
    if (!userId && !sessionId)
      return res
        .status(400)
        .json({ message: "Either a valid token or sessionId is required." });

    /* 3) Check current quantity of this product in the cart */
    const whereClause = userId
      ? { userId, productId }
      : { sessionId, productId };

    const existingCartItem = await CartItem.findOne({ where: whereClause });
    const alreadyInCart = existingCartItem ? existingCartItem.quantity : 0;

    /* 4) Enforce stock limit */
    const totalAfterAdd = alreadyInCart + requestedQty;
    if (totalAfterAdd > product.quantityInStocks) {
      return res.status(400).json({
        message: `Not enough stock. You already have ${alreadyInCart} in your cart and only ${product.quantityInStocks} are available.`,
      });
    }

    /* 5) Create or update the cart item */
    if (existingCartItem) {
      existingCartItem.quantity = totalAfterAdd;
      await existingCartItem.save();
    } else {
      await CartItem.create({
        productId,
        quantity: requestedQty,
        userId,
        sessionId: userId ? null : sessionId,
      });
    }

    return res
      .status(200)
      .json({ message: "Item successfully added to cart." });
  } catch (err) {
    console.error("Error while adding to cart:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Sepetteki ürünleri listeleme
exports.getCart = async (req, res) => {
  console.log("DEBUG | getCart fonksiyonu başladı");
  try {
    const { sessionId } = req.query;
    // Token varsa userId, yoksa null
    let userId = req.user ? req.user.id : null;

    console.log("DEBUG | sessionId:", sessionId);

    console.log("DEBUG | userId:", userId);

    // userId de yok, sessionId de yok -> hata
    if (!userId && !sessionId) {
      return res.status(400).json({
        message:
          "Sepeti görüntülemek için user veya sessionId bilgisi girilmeli.",
      });
    }

    // user varsa userId'ye göre, yoksa sessionId'ye göre getir
    const whereClause = userId ? { userId } : { sessionId };
    const cartItems = await CartItem.findAll({
      where: whereClause,
      include: [Product],
    });

    return res.status(200).json(cartItems);
  } catch (error) {
    console.error("Sepeti görüntüleme hatası:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Sepetten ürün silme
exports.removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const cartItem = await CartItem.findByPk(cartItemId);

    if (!cartItem) {
      return res.status(404).json({ message: "CartItem bulunamadı!" });
    }
    await cartItem.destroy();

    return res.status(200).json({ message: "Ürün sepetten silindi!" });
  } catch (error) {
    console.error("removeFromCart hatası:", error);
    return res.status(500).json({ error: error.message });
  }
};

// Merge / Birleştirme
// Login olan user, daha önce sessionId ile ürün eklemişse bu metotla userId'ye taşıyabilir.
exports.mergeCart = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Önce login olmalısınız (token)!" });
    }

    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: "sessionId eksik!" });
    }

    // sessionId'ye ait bütün cartItem'ları userId'ye taşı
    await CartItem.update(
      { userId: req.user.id, sessionId: null },
      { where: { sessionId } }
    );

    return res.status(200).json({ message: "Sepet birleştirildi." });
  } catch (error) {
    console.error("Sepet birleştirme hatası:", error);
    return res.status(500).json({ error: error.message });
  }
};
