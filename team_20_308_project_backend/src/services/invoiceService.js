// ─────────────────────────────────────────────
// src/services/invoiceService.js   (TAM DOSYA)
// ─────────────────────────────────────────────
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Generate invoice PDF stream   (TechPoint branding)
 * -------------------------------------------------
 * order   : Order instance
 * items   : OrderItem[]  (alias: product)
 * user    : { name, email, address }
 * logoPath: optional custom logo
 */
function generateInvoicePDFStream({
  order,
  items,
  user,
  logoPath = path.join(__dirname, "../assets/logo.png"),
}) {
  /* ---------- FONT (tek variable TTF) ---------- */
  const varFontPath = path.join(
    __dirname,
    "../assets/fonts/OpenSans-VariableFont_wdth,wght.ttf"
  );

  const doc = new PDFDocument({ size: "A4", margin: 40 });

  try {
    if (fs.existsSync(varFontPath)) {
      doc.registerFont("Body", varFontPath); // regular
      doc.registerFont("Body-Bold", varFontPath); // bold: aynı dosya
    }
  } catch (e) {
    console.error("⚠️  OpenSans variable font yüklenemedi:", e.message);
  }

  const body = doc._fontFamilies["Body"] ? "Body" : "Helvetica";
  const bold = doc._fontFamilies["Body-Bold"] ? "Body-Bold" : "Helvetica-Bold";

  /* ---------- HEADER ---------- */
  if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 20, { width: 140 });

  /* ---------- “Dear …” BLOĞU ---------- */
  const headerY = 120;
  doc
    .fontSize(10)
    .font(body)
    .text(`Dear ${user.name || "-"},`, 40, headerY);

  // Adres: tek çağrı, genişlik 280 px, meta blokla çakışmaz
  if (user.address) {
    doc
      .moveDown(0.2)
      .text(formatAddress(user.address), 55, undefined, { width: 280 }); // 40+15 indent
  }
  doc.moveDown(0.2).text(`Email: ${user.email}`, 55);

  /* ---------- META (sağ) ---------- */
  const meta = [
    ["Invoice No:", order.invoiceNo || `INV-${order.id}`],
    ["Invoice Type:", "Purchase"],
    ["Invoice Date:", formatDate(order.createdAt)],
    ["Invoice Time:", formatTime(order.createdAt)],
  ];
  meta.forEach(([lbl, val], i) => {
    const y = headerY + i * 14;
    doc.font(body).text(lbl, 350, y).font(bold).text(val, 470, y);
  });

  /* ---------- TABLO ---------- */
  const tableTop = 260;
  drawTableHeader(doc, tableTop, bold);

  let posY = tableTop + 22;
  items.forEach((row) => {
    drawRow(doc, posY, row, body);
    posY += 32;
  });

  /* ---------- TOPLAM ---------- */
  const grand = items.reduce(
    (s, it) => s + parseFloat(it.price) * it.quantity,
    0
  );
  doc
    .moveTo(40, posY + 4)
    .lineTo(555, posY + 4)
    .stroke();
  doc
    .fontSize(12)
    .font(bold)
    .text(`Grand Total: ${toCurrency(grand)}`, 40, posY + 12);

  /* ---------- FOOTER ---------- */
  doc
    .fontSize(8)
    .fillColor("#666")
    .text(
      "Goods sold are non‑refundable except as provided by applicable consumer law.",
      40,
      doc.page.height - 60,
      { width: doc.page.width - 80, align: "center" }
    );

  doc.end();
  return doc;
}

/* ---------- Yardımcılar ---------- */
function formatAddress(a) {
  if (!a) return "-";

  /* 1️⃣  JSON string ise objeye çevir */
  if (typeof a === "string") {
    try {
      a = JSON.parse(a);
    } catch {
      return a;
    } // parse edilemezse olduğu gibi yaz
  }

  const l1 = [a.city, a.district, a.neighborhood].filter(Boolean).join(", ");
  const l2 = [
    a.street,
    a.apartment ? `Apt ${a.apartment}` : null,
    a.doorNumber ? `Door ${a.doorNumber}` : null,
    a.floor ? `Floor ${a.floor}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const l3 = [a.zip, "–", a.country].filter(Boolean).join(" ");

  return [l1, l2, l3].filter(Boolean).join("\n");
}
const formatDate = (d) => new Date(d).toLocaleDateString("en-GB");
const formatTime = (d) =>
  new Date(d).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
const toCurrency = (v) => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return `${Number.isNaN(n) ? v : `$${n.toFixed(2)}`}`; // ✅ $ başta
};

function drawTableHeader(doc, y, bold) {
  doc
    .font(bold)
    .fontSize(10)
    .text("Product", 40, y)
    .text("Quantity", 300, y, { width: 60, align: "right" })
    .text("Unit Price", 370, y, { width: 80, align: "right" })
    .text("Line Total", 460, y, { width: 80, align: "right" });
  doc
    .moveTo(40, y + 15)
    .lineTo(555, y + 15)
    .stroke();
}
function drawRow(doc, y, row, body) {
  const p = row.product || row.Product || {};
  const desc = `${p.name ?? ""} (${p.model ?? ""})\nSN: ${
    p.serialNumber ?? ""
  }`;
  const qty = row.quantity;
  const unit = toCurrency(row.price);
  const tot = toCurrency(parseFloat(row.price) * qty);

  doc
    .font(body)
    .fontSize(9)
    .text(desc, 40, y)
    .text(qty.toString(), 300, y + 6, { width: 60, align: "right" })
    .text(unit, 370, y + 6, { width: 80, align: "right" })
    .text(tot, 460, y + 6, { width: 80, align: "right" });
}

module.exports = { generateInvoicePDFStream };
