/*
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  DEMO-READY BACKUP — DO NOT MODIFY                          ║
 * ║  Restore: cp scripts/seed-demo-FINAL.js scripts/seed-demo.js ║
 * ║  Then:    docker compose exec api npm run db:seed            ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 *
 * Demo seeder for CS 436 e-commerce project.
 *
 * Run:
 *   npm run db:seed         # insert / refresh demo data (idempotent)
 *   npm run db:seed:undo    # remove demo workflow data (orders/comments/etc)
 *
 * Inside Docker:
 *   docker compose exec api npm run db:seed
 *
 * Design notes:
 *   - Uses Sequelize models directly so we do NOT need sequelize-cli at runtime.
 *     (sequelize-cli stays in devDependencies; this keeps the prod image small.)
 *   - Demo users are upserted by email.
 *   - Categories are upserted by name (icon refreshed each run).
 *   - Products are upserted by serialNumber (unique field on Product).
 *   - Workflow rows (comments, ratings, wishlist, orders) are cleared by demo
 *     userId before re-insert, so the seeder is safe to re-run.
 *   - We never touch users/products/orders that were not created by this seeder.
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");

const sequelize = require("../src/config/db");
// Loading associations also loads every model and wires the relationships.
const models = require("../src/models/associations");

const {
  User,
  Product,
  Category,
  Comment,
  Rating,
  Wishlist,
  Order,
  OrderItem,
} = models;

/* ────────────────────────────────────────────────────────────── *
 * Demo accounts
 * ────────────────────────────────────────────────────────────── */
const DEMO_USERS = [
  {
    email: "selim.cicek@sabanciuniv.edu",
    name: "Selim Cicek",
    password: "Customer123!",
    role: "customer",
    address: JSON.stringify({
      city: "Istanbul",
      district: "Sisli",
      neighborhood: "Nisantasi",
      street: "Abdi Ipekci Caddesi",
      apartment: "12",
      doorNumber: "4",
      floor: "3",
      zip: "34367",
      country: "Turkey",
    }),
  },
  {
    email: "pm@example.com",
    name: "Demo Product Manager",
    password: "Product123!",
    role: "product_manager",
  },
  {
    email: "sm@example.com",
    name: "Demo Sales Manager",
    password: "Sales123!",
    role: "sales_manager",
  },
  // Reviewer accounts so each product can have multiple comments/ratings.
  {
    email: "reviewer1@example.com",
    name: "Alice Walker",
    password: "Reviewer123!",
    role: "customer",
  },
  {
    email: "reviewer2@example.com",
    name: "Brian Lee",
    password: "Reviewer123!",
    role: "customer",
  },
  {
    email: "reviewer3@example.com",
    name: "Carla Diaz",
    password: "Reviewer123!",
    role: "customer",
  },
  {
    email: "reviewer4@example.com",
    name: "David Park",
    password: "Reviewer123!",
    role: "customer",
  },
];

/* ────────────────────────────────────────────────────────────── *
 * Categories — icon names must match Header.tsx iconComponentMap
 * ────────────────────────────────────────────────────────────── */
const DEMO_CATEGORIES = [
  { name: "Laptops",         icon: "laptop"     },
  { name: "Phones",          icon: "phone"      },
  { name: "TV & Audio",      icon: "tv"         },
  { name: "Gaming",          icon: "gamepad"    },
  { name: "Headphones",      icon: "headphones" },
  { name: "Keyboards",       icon: "keyboard"   },
  { name: "Cameras & Drones", icon: "camera"   },
];

/* ────────────────────────────────────────────────────────────── *
 * Products
 * ────────────────────────────────────────────────────────────── */
const DEMO_PRODUCTS = [
  /* ── Laptops ── */
  {
    name: "Apple MacBook Pro 14\" M4 Pro",
    model: "MK1J3LL/A",
    serialNumber: "SEED-LP-001",
    description:
      "Apple MacBook Pro 14-inch with M4 Pro chip, 18GB unified memory and 512GB SSD. "
      + "Liquid Retina XDR display, all-day battery life and Thunderbolt 4 ports.",
    quantityInStocks: 8,
    price: 2249.00,
    cost: 1700.00,
    warrantyStatus: true,
    distributorInfo: "Apple Inc.",
    imageUrl:
      "https://assets.mmsrg.com/isr/166325/c1/-/ASSET_MMS_146744370?x=1800&y=1800&format=jpg&quality=80&sp=yes&strip=yes&trim&ex=1800&ey=1800&align=center&resizesource&unsharp=1.5x1+0.7+0.02&cox=0&coy=0&cdx=1800&cdy=1800",
    category: "Laptops",
  },
  {
    name: "Dell XPS 13 Plus",
    model: "XPS13-9320",
    serialNumber: "SEED-LP-002",
    description:
      "Premium ultrabook with a 13.4\" InfinityEdge OLED display, Intel Core i7-1360P, "
      + "16GB LPDDR5 RAM and 512GB NVMe SSD.",
    quantityInStocks: 6,
    price: 1299.00,
    cost: 950.00,
    warrantyStatus: true,
    distributorInfo: "Dell Direct",
    imageUrl:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=60",
    category: "Laptops",
  },
  {
    name: "Lenovo ThinkPad X1 Carbon Gen 11",
    model: "TP-X1C-G11",
    serialNumber: "SEED-LP-003",
    description:
      "Business-class 14\" ultrabook with 13th-gen Intel Core i7, 16GB RAM, "
      + "1TB SSD, MIL-SPEC durability and TrackPoint keyboard.",
    quantityInStocks: 4,
    price: 1599.00,
    cost: 1200.00,
    warrantyStatus: true,
    distributorInfo: "Lenovo Business",
    imageUrl:
      "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=60",
    category: "Laptops",
  },
  {
    name: "MSI Raider GE78 HX Gaming Laptop",
    model: "GE78HX-13VH",
    serialNumber: "SEED-LP-004",
    description:
      "17\" gaming powerhouse with 13th-gen Intel Core i9, NVIDIA GeForce RTX 4080, "
      + "32GB DDR5 RAM, 1TB PCIe SSD and a 240Hz QHD+ display.",
    quantityInStocks: 5,
    price: 2199.99,
    cost: 1650.00,
    warrantyStatus: true,
    distributorInfo: "MSI Global",
    imageUrl:
      "https://cdn.vatanbilgisayar.com/Upload/PRODUCT/msi/thumb/137825-1_large.jpg",
    category: "Laptops",
  },

  /* ── Phones ── */
  {
    name: "Apple iPhone 15 Pro",
    model: "A2650",
    serialNumber: "SEED-PH-001",
    description:
      "6.1\" Super Retina XDR display, A17 Pro chip, titanium design, "
      + "48MP triple-camera system and USB-C connectivity.",
    quantityInStocks: 15,
    price: 1099.00,
    cost: 800.00,
    warrantyStatus: true,
    distributorInfo: "Apple Inc.",
    imageUrl:
      "https://assets.mmsrg.com/isr/166325/c1/-/ASSET_MMS_120141353?x=1800&y=1800&format=jpg&quality=80&sp=yes&strip=yes&trim&ex=1800&ey=1800&align=center&resizesource&unsharp=1.5x1+0.7+0.02&cox=0&coy=0&cdx=1800&cdy=1800",
    category: "Phones",
  },
  {
    name: "Samsung Galaxy S24 Ultra (Product F)",
    model: "SM-S928U",
    serialNumber: "SEED-PH-002",
    description:
      "6.8\" QHD+ Dynamic AMOLED 2X, Snapdragon 8 Gen 3, 12GB RAM, 256GB storage, "
      + "200MP quad-camera system and built-in S Pen for ultimate productivity.",
    quantityInStocks: 18,
    price: 1299.99,
    cost: 950.00,
    warrantyStatus: true,
    distributorInfo: "Samsung Electronics",
    imageUrl:
      "https://cdn.vatanbilgisayar.com/Upload/PRODUCT/samsung/thumb/143409-1-1_large.jpg",
    category: "Phones",
  },
  {
    name: "Google Pixel 8 Pro",
    model: "GC3VE",
    serialNumber: "SEED-PH-003",
    description:
      "6.7\" Super Actua LTPO OLED, Google Tensor G3, 12GB RAM, "
      + "advanced AI camera features and 7 years of OS + security updates.",
    quantityInStocks: 3,
    price: 999.00,
    cost: 720.00,
    warrantyStatus: true,
    distributorInfo: "Google Store",
    imageUrl:
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=60",
    category: "Phones",
  },
  {
    name: "OnePlus 12",
    model: "CPH2581",
    serialNumber: "SEED-PH-004",
    description:
      "6.82\" LTPO AMOLED 2K, Snapdragon 8 Gen 3, 12GB RAM, 256GB storage "
      + "and 100W SuperVOOC wired charging.",
    quantityInStocks: 7,
    price: 799.00,
    cost: 580.00,
    warrantyStatus: true,
    distributorInfo: "OnePlus Official",
    imageUrl:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=60",
    category: "Phones",
  },

  /* ── TV & Audio ── */
  {
    name: "LG 65\" C4 OLED evo 4K Smart TV",
    model: "OLED65C4PUA",
    serialNumber: "SEED-TV-001",
    description:
      "65\" OLED evo with the a9 AI Processor Gen7, Dolby Vision IQ, "
      + "120Hz HDMI 2.1 and NVIDIA G-SYNC for the ultimate gaming and cinema experience.",
    quantityInStocks: 20,
    price: 1399.99,
    cost: 1050.00,
    warrantyStatus: true,
    distributorInfo: "LG Electronics USA",
    imageUrl:
      "https://media.us.lg.com/transform/ecomm-PDPGallery-1100x730/e6447925-25cd-492e-8904-1569ea52e517/TV_OLED65C4PUA_gallery-01_3000x3000?io=transform:fill,width:596",
    category: "TV & Audio",
  },
  {
    name: "Samsung 55\" Crystal UHD 4K Smart TV",
    model: "UN55DU8000FXZA",
    serialNumber: "SEED-TV-002",
    description:
      "55\" Crystal UHD 4K with PurColor, HDR10+ and Smart Hub. "
      + "Voice assistant support and a clean cable management solution.",
    quantityInStocks: 12,
    price: 999.99,
    cost: 720.00,
    warrantyStatus: true,
    distributorInfo: "Samsung Electronics",
    imageUrl:
      "https://images.samsung.com/is/image/samsung/p6pim/tr/ue55cu7200uxtk/gallery/tr-crystal-uhd-cu7000-459766-ue55cu7200uxtk-536579700?$684_547_JPG$",
    category: "TV & Audio",
  },
  {
    name: "Sony Bravia XR-55A80L OLED (Product E)",
    model: "XR-55A80L",
    serialNumber: "SEED-TV-003",
    description:
      "55\" OLED 4K HDR TV with XR cognitive processor, Dolby Vision "
      + "and Acoustic Surface Audio+ that turns the screen itself into the speaker.",
    quantityInStocks: 5,
    price: 1899.00,
    cost: 1400.00,
    warrantyStatus: true,
    distributorInfo: "Sony Electronics",
    imageUrl:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=60",
    category: "TV & Audio",
  },
  {
    name: "Sonos Beam (Gen 2) Smart Soundbar",
    model: "BEAM2",
    serialNumber: "SEED-TV-004",
    description:
      "Compact smart soundbar with Dolby Atmos, Alexa / Google Assistant built in "
      + "and seamless Sonos multi-room audio.",
    quantityInStocks: 0,
    price: 499.00,
    cost: 350.00,
    warrantyStatus: true,
    distributorInfo: "Sonos Inc.",
    imageUrl:
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=60",
    category: "TV & Audio",
  },

  /* ── Gaming ── */
  {
    name: "Sony PlayStation 5 Digital Edition",
    model: "CFI-1200A",
    serialNumber: "SEED-GM-001",
    description:
      "Next-gen console with a custom SSD, 3D Audio, DualSense haptic feedback "
      + "and backward compatibility with PS4 titles.",
    quantityInStocks: 10,
    price: 499.99,
    cost: 380.00,
    warrantyStatus: true,
    distributorInfo: "Sony Interactive Entertainment",
    imageUrl:
      "https://assets.mmsrg.com/isr/166325/c1/-/ASSET_MMS_147359875?x=1800&y=1800&format=jpg&quality=80&sp=yes&strip=yes&trim&ex=1800&ey=1800&align=center&resizesource&unsharp=1.5x1+0.7+0.02&cox=0&coy=0&cdx=1800&cdy=1800",
    category: "Gaming",
  },
  {
    name: "Microsoft Xbox Series X 1TB",
    model: "RRT-00001",
    serialNumber: "SEED-GM-002",
    description:
      "The most powerful Xbox ever: 4K gaming at up to 120FPS, DirectX ray tracing, "
      + "lightning-fast custom SSD and backward compatibility across four generations.",
    quantityInStocks: 29,
    price: 499.99,
    cost: 370.00,
    warrantyStatus: true,
    distributorInfo: "Microsoft Corporation",
    imageUrl:
      "https://img-itopya.mncdn.com/cdn/1000/xbox-series-x-1tb-oyun-konsolu-4-190606.jpg",
    category: "Gaming",
  },

  /* ── Headphones ── */
  {
    name: "Sony WH-1000XM5 (Product H)",
    model: "WH-1000XM5",
    serialNumber: "SEED-HP-001",
    description:
      "Industry-leading noise-cancelling wireless headphones with 30-hour battery, "
      + "multipoint connection and Speak-to-Chat.",
    quantityInStocks: 20,
    price: 399.00,
    cost: 280.00,
    warrantyStatus: true,
    distributorInfo: "Sony Electronics",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=60",
    category: "Headphones",
  },
  {
    name: "Bose QuietComfort Ultra",
    model: "QC-ULTRA",
    serialNumber: "SEED-HP-002",
    description:
      "Premium wireless headphones with Bose Immersive Audio, world-class noise "
      + "cancellation and up to 24 hours of battery life.",
    quantityInStocks: 6,
    price: 429.00,
    cost: 310.00,
    warrantyStatus: true,
    distributorInfo: "Bose Corporation",
    imageUrl:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=60",
    category: "Headphones",
  },
  {
    name: "Apple AirPods Max (Product A)",
    model: "A2096",
    serialNumber: "SEED-HP-003",
    description:
      "Over-ear wireless headphones with Apple silicon, computational audio, "
      + "Active Noise Cancellation and Personalized Spatial Audio.",
    quantityInStocks: 0,
    price: 439.00,
    cost: 300.00,
    warrantyStatus: true,
    distributorInfo: "Apple Inc.",
    imageUrl:
      "https://cdn.vatanbilgisayar.com/Upload/PRODUCT/apple/thumb/115719-ana_large.jpg",
    category: "Headphones",
  },
  {
    name: "Beats Studio Pro Wireless (Product B)",
    model: "MQTP3LL/A",
    serialNumber: "SEED-HP-004",
    description:
      "Personalized spatial audio, active noise cancellation and up to 40 hours "
      + "of battery life. USB-C and 3.5mm audio input.",
    quantityInStocks: 1,
    price: 350.00,
    cost: 240.00,
    warrantyStatus: true,
    distributorInfo: "Beats Official Distributor",
    imageUrl:
      "https://cdn.vatanbilgisayar.com/Upload/PRODUCT/beats/thumb/140719-4_large.jpg",
    category: "Headphones",
  },

  /* ── Keyboards ── */
  {
    name: "Logitech MK470 Slim Wireless Combo",
    model: "MK470",
    serialNumber: "SEED-KB-001",
    description:
      "Ultra-slim wireless keyboard and mouse set. Near-silent keys, 2.4GHz Logi "
      + "Bolt receiver, up to 36-month battery on the keyboard.",
    quantityInStocks: 10,
    price: 79.99,
    cost: 45.00,
    warrantyStatus: true,
    distributorInfo: "Logitech",
    imageUrl:
      "https://reimg-teknosa-cloud-prod.mncdn.com/mnresize/1200/1200/productimage/125200387/125200387_1_MC/44428545.png",
    category: "Keyboards",
  },
  {
    name: "Apple Magic Keyboard with Touch ID",
    model: "MK2C3",
    serialNumber: "SEED-KB-002",
    description:
      "Wireless keyboard with rechargeable battery, scissor-mechanism keys and "
      + "Touch ID for secure login and Apple Pay.",
    quantityInStocks: 14,
    price: 99.00,
    cost: 62.00,
    warrantyStatus: true,
    distributorInfo: "Apple Inc.",
    imageUrl:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=60",
    category: "Keyboards",
  },

  /* ── Cameras & Drones ── */
  {
    name: "Sony Alpha A7 IV",
    model: "ILCE-7M4",
    serialNumber: "SEED-CM-001",
    description:
      "33MP full-frame mirrorless camera with 4K60 video, 759-point hybrid AF "
      + "and real-time eye tracking for humans and animals.",
    quantityInStocks: 4,
    price: 2499.00,
    cost: 1900.00,
    warrantyStatus: true,
    distributorInfo: "Sony Imaging",
    imageUrl:
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=60",
    category: "Cameras & Drones",
  },
  {
    name: "Canon EOS R6 Mark II (Product C)",
    model: "EOS-R6M2",
    serialNumber: "SEED-CM-002",
    description:
      "24.2MP full-frame mirrorless with 40fps electronic shutter, "
      + "6K oversampled 4K video and Dual Pixel CMOS AF II.",
    quantityInStocks: 6,
    price: 2499.00,
    cost: 1850.00,
    warrantyStatus: true,
    distributorInfo: "Canon USA",
    imageUrl:
      "https://images.unsplash.com/photo-1606937295547-bc0f668595c2?auto=format&fit=crop&w=600&q=60",
    category: "Cameras & Drones",
  },
  {
    name: "DJI Mavic 3 Pro",
    model: "MAVIC3-PRO",
    serialNumber: "SEED-CM-003",
    description:
      "Triple-camera flagship drone with a 4/3 CMOS Hasselblad main sensor, "
      + "5.1K video and 43-minute max flight time.",
    quantityInStocks: 0,
    price: 2199.00,
    cost: 1600.00,
    warrantyStatus: true,
    distributorInfo: "DJI Authorized",
    imageUrl:
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=600&q=60",
    category: "Cameras & Drones",
  },
  {
    name: "GoPro HERO12 Black (Product G)",
    model: "CHDHX-121",
    serialNumber: "SEED-CM-004",
    description:
      "5.3K60 action camera with HyperSmooth 6.0 stabilization, HDR video, "
      + "wireless audio support and 10m waterproof rating.",
    quantityInStocks: 11,
    price: 399.00,
    cost: 270.00,
    warrantyStatus: true,
    distributorInfo: "GoPro Official",
    imageUrl:
      "https://images.unsplash.com/photo-1567443024551-f3e3cc2be870?auto=format&fit=crop&w=600&q=60",
    category: "Cameras & Drones",
  },
];

/* Comments and ratings keyed by product serial number. */
const REVIEW_DATA = {
  "SEED-LP-001": {
    ratings: [
      ["reviewer1@example.com", 5],
      ["reviewer2@example.com", 5],
      ["reviewer3@example.com", 4],
      ["reviewer4@example.com", 5],
    ],
    approved: [
      ["reviewer1@example.com", "Performance is incredible and battery lasts all day."],
      ["reviewer2@example.com", "Best MacBook I have ever owned. Display is stunning."],
    ],
    pending: [
      ["reviewer3@example.com", "Still testing, but first impressions are excellent."],
    ],
  },
  "SEED-LP-002": {
    ratings: [
      ["reviewer1@example.com", 4],
      ["reviewer2@example.com", 4],
    ],
    approved: [
      ["reviewer2@example.com", "Sleek design and very fast for everyday work."],
    ],
    pending: [],
  },
  "SEED-LP-003": {
    ratings: [
      ["reviewer3@example.com", 5],
      ["reviewer4@example.com", 4],
    ],
    approved: [
      ["reviewer4@example.com", "Best business laptop keyboard you can find."],
    ],
    pending: [
      ["reviewer1@example.com", "Solid build quality, testing long-term durability."],
    ],
  },
  "SEED-LP-004": {
    ratings: [
      ["reviewer2@example.com", 5],
      ["reviewer3@example.com", 5],
    ],
    approved: [
      ["reviewer2@example.com", "Handles everything I throw at it — AAA games, 3D renders, no throttle."],
    ],
    pending: [
      ["reviewer4@example.com", "Just arrived, running benchmarks now."],
    ],
  },
  "SEED-PH-001": {
    ratings: [
      ["reviewer1@example.com", 5],
      ["reviewer3@example.com", 5],
      ["reviewer4@example.com", 4],
    ],
    approved: [
      ["reviewer1@example.com", "Camera is phenomenal, especially in low light."],
      ["reviewer4@example.com", "Premium titanium feel and blazing fast performance."],
    ],
    pending: [
      ["reviewer3@example.com", "Just got it, more thoughts after a full week."],
    ],
  },
  "SEED-PH-002": {
    ratings: [
      ["reviewer2@example.com", 5],
      ["reviewer3@example.com", 4],
    ],
    approved: [
      ["reviewer2@example.com", "S Pen is a game changer for productivity on the go."],
    ],
    pending: [],
  },
  "SEED-PH-003": {
    ratings: [
      ["reviewer1@example.com", 4],
      ["reviewer4@example.com", 5],
    ],
    approved: [
      ["reviewer4@example.com", "AI features feel genuinely useful, not gimmicky."],
    ],
    pending: [
      ["reviewer2@example.com", "Waiting on the latest software update before final verdict."],
    ],
  },
  "SEED-TV-001": {
    ratings: [
      ["reviewer1@example.com", 5],
      ["reviewer2@example.com", 5],
    ],
    approved: [
      ["reviewer1@example.com", "Black levels are unreal — perfect for dark room cinema."],
      ["reviewer2@example.com", "Gaming on this 65\" OLED at 120Hz is a completely different experience."],
    ],
    pending: [],
  },
  "SEED-TV-002": {
    ratings: [
      ["reviewer3@example.com", 4],
      ["reviewer4@example.com", 4],
    ],
    approved: [
      ["reviewer3@example.com", "Great value 4K TV, colors pop and smart features work well."],
    ],
    pending: [],
  },
  "SEED-GM-001": {
    ratings: [
      ["reviewer1@example.com", 5],
      ["reviewer2@example.com", 5],
      ["reviewer4@example.com", 5],
    ],
    approved: [
      ["reviewer1@example.com", "DualSense haptics are insane — completely changes immersion."],
      ["reviewer2@example.com", "Load times are near instant compared to last gen."],
    ],
    pending: [
      ["reviewer3@example.com", "Game library is growing fast, very happy so far."],
    ],
  },
  "SEED-GM-002": {
    ratings: [
      ["reviewer3@example.com", 5],
      ["reviewer4@example.com", 4],
    ],
    approved: [
      ["reviewer4@example.com", "Game Pass is incredible value and Quick Resume is super convenient."],
    ],
    pending: [],
  },
  "SEED-HP-001": {
    ratings: [
      ["reviewer1@example.com", 5],
      ["reviewer2@example.com", 5],
      ["reviewer4@example.com", 5],
    ],
    approved: [
      ["reviewer1@example.com", "Best noise cancelling I have ever used — planes, offices, cafes."],
      ["reviewer2@example.com", "Insanely comfortable even during long sessions."],
    ],
    pending: [
      ["reviewer3@example.com", "Just unboxed, listening tests in progress."],
    ],
  },
  "SEED-HP-003": {
    ratings: [
      ["reviewer3@example.com", 4],
      ["reviewer4@example.com", 5],
    ],
    approved: [
      ["reviewer4@example.com", "Spatial audio and build quality justify every penny."],
    ],
    pending: [],
  },
  "SEED-KB-001": {
    ratings: [
      ["reviewer1@example.com", 4],
      ["reviewer3@example.com", 5],
    ],
    approved: [
      ["reviewer3@example.com", "Near-silent keys and the battery lasts forever. Perfect office setup."],
    ],
    pending: [],
  },
  "SEED-CM-002": {
    ratings: [
      ["reviewer2@example.com", 5],
      ["reviewer4@example.com", 5],
    ],
    approved: [
      ["reviewer2@example.com", "Autofocus tracking is unbelievably reliable at fast apertures."],
    ],
    pending: [
      ["reviewer1@example.com", "Pending until I shoot a full event with it."],
    ],
  },
  "SEED-CM-004": {
    ratings: [
      ["reviewer1@example.com", 4],
      ["reviewer3@example.com", 5],
    ],
    approved: [
      ["reviewer3@example.com", "HyperSmooth stabilization is incredible for action vlogging."],
    ],
    pending: [],
  },
};

/* Demo customer wishlist — serial numbers.
 * NOTE: Canon R6 (SEED-CM-002 / Product C) is intentionally excluded —
 * the customer adds it to wishlist during Step 1.5 of the demo. */
const DEMO_WISHLIST = [
  "SEED-LP-001", // MacBook Pro M4
  "SEED-PH-001", // iPhone 15 Pro
  "SEED-GM-001", // PS5
  "SEED-HP-002", // Bose QuietComfort Ultra
];

/*
 * Demo orders — mapped to demo script letters:
 *
 *  E  Sony Bravia (Product E)          delivered >1 month → customer rates it, CANNOT refund
 *  F  Samsung Galaxy S24 Ultra (F)     delivered <1 month → customer requests refund; SM sets 30% discount
 *  G  GoPro HERO12 Black               processing         → customer cancels during Step 1.7
 *  H  Sony WH-1000XM5 (Product H)      in-transit         → just shown in order history
 *  —  Xbox Series X                    cancelled          → extra status variety for Step 1.6
 *
 *  Product B (Beats Studio Pro) is purchased DURING the demo in Step 3.
 */
const DEMO_ORDERS = [
  {
    status: "delivered",
    daysAgo: 35, // >1 month — customer cannot request refund (Product E)
    items: [
      { serial: "SEED-TV-003", quantity: 1 }, // Sony Bravia (Product E)
    ],
  },
  {
    status: "delivered",
    daysAgo: 14, // <1 month — customer can request refund (Product F)
    items: [
      { serial: "SEED-PH-002", quantity: 1 }, // Samsung Galaxy S24 Ultra (Product F)
    ],
  },
  {
    status: "processing",
    daysAgo: 1, // customer cancels this during Step 1.7 (Product G)
    items: [
      { serial: "SEED-CM-004", quantity: 1 }, // GoPro HERO12 Black (Product G)
    ],
  },
  {
    status: "in-transit",
    daysAgo: 4, // just shown in order history (Product H)
    items: [
      { serial: "SEED-HP-001", quantity: 1 }, // Sony WH-1000XM5 (Product H)
    ],
  },
  {
    status: "cancelled",
    daysAgo: 20, // extra order for status variety demo
    items: [
      { serial: "SEED-GM-002", quantity: 1 }, // Xbox Series X
    ],
  },
];

const DEMO_SHIPPING_ADDRESS = {
  city: "Istanbul",
  district: "Sisli",
  neighborhood: "Nisantasi",
  street: "Abdi Ipekci Caddesi",
  apartment: "12",
  doorNumber: "4",
  floor: "3",
  zip: "34367",
  country: "Turkey",
};

/* ────────────────────────────────────────────────────────────── *
 * Helpers
 * ────────────────────────────────────────────────────────────── */
function log(msg) {
  process.stdout.write(`[seed-demo] ${msg}\n`);
}

async function upsertUser(data) {
  const hashed = await bcrypt.hash(data.password, 10);
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) {
    existing.name = data.name;
    existing.password = hashed;
    existing.role = data.role;
    if (data.address !== undefined) existing.address = data.address;
    await existing.save();
    return existing;
  }
  return User.create({
    email: data.email,
    name: data.name,
    password: hashed,
    role: data.role,
    ...(data.address !== undefined && { address: data.address }),
  });
}

async function upsertCategory(data) {
  const existing = await Category.findOne({ where: { name: data.name } });
  if (existing) {
    if (existing.icon !== data.icon) {
      existing.icon = data.icon;
      await existing.save();
    }
    return existing;
  }
  return Category.create(data);
}

async function upsertProduct(data, categoryByName) {
  const { category, ...productData } = data;
  let product = await Product.findOne({
    where: { serialNumber: productData.serialNumber },
  });
  if (product) {
    await product.update(productData);
  } else {
    product = await Product.create(productData);
  }
  const cat = categoryByName[category];
  if (cat) {
    await product.setCategories([cat]);
  }
  return product;
}

async function clearDemoWorkflowData(demoUserIds, customerId) {
  const oldOrders = await Order.findAll({
    where: { userId: customerId },
    attributes: ["id"],
  });
  const oldOrderIds = oldOrders.map((o) => o.id);
  if (oldOrderIds.length) {
    await OrderItem.destroy({ where: { orderId: oldOrderIds } });
    await Order.destroy({ where: { id: oldOrderIds } });
  }

  await Comment.destroy({ where: { userId: demoUserIds } });
  await Rating.destroy({ where: { userId: demoUserIds } });
  await Wishlist.destroy({ where: { userId: demoUserIds } });
}

async function insertReviews(productsBySerial, usersByEmail) {
  let approvedCount = 0;
  let pendingCount = 0;
  let ratingCount = 0;

  for (const [serial, data] of Object.entries(REVIEW_DATA)) {
    const product = productsBySerial[serial];
    if (!product) continue;

    for (const [email, score] of data.ratings) {
      const user = usersByEmail[email];
      if (!user) continue;
      await Rating.create({
        userId: user.id,
        productId: product.id,
        rating: score,
      });
      ratingCount++;
    }

    for (const [email, text] of data.approved) {
      const user = usersByEmail[email];
      if (!user) continue;
      await Comment.create({
        userId: user.id,
        productId: product.id,
        text,
        approved: true,
      });
      approvedCount++;
    }

    for (const [email, text] of data.pending) {
      const user = usersByEmail[email];
      if (!user) continue;
      await Comment.create({
        userId: user.id,
        productId: product.id,
        text,
        approved: false,
      });
      pendingCount++;
    }
  }

  log(
    `Inserted ${ratingCount} ratings, ${approvedCount} approved comments, `
    + `${pendingCount} pending comments.`
  );
}

async function insertWishlist(productsBySerial, customer) {
  for (const serial of DEMO_WISHLIST) {
    const product = productsBySerial[serial];
    if (!product) continue;
    await Wishlist.create({
      userId: customer.id,
      productId: product.id,
    });
  }
  log(`Inserted ${DEMO_WISHLIST.length} wishlist items for demo customer.`);
}

async function insertOrders(productsBySerial, customer) {
  let orderCount = 0;
  for (const orderSpec of DEMO_ORDERS) {
    const createdAt = new Date(
      Date.now() - orderSpec.daysAgo * 24 * 60 * 60 * 1000
    );

    let total = 0;
    const itemSpecs = [];
    for (const it of orderSpec.items) {
      const product = productsBySerial[it.serial];
      if (!product) continue;
      const linePrice = Number(product.price);
      total += linePrice * it.quantity;
      itemSpecs.push({ product, quantity: it.quantity, price: linePrice });
    }
    if (!itemSpecs.length) continue;

    const order = await Order.create({
      userId: customer.id,
      totalPrice: total.toFixed(2),
      status: orderSpec.status,
      shippingAddress: DEMO_SHIPPING_ADDRESS,
      createdAt,
    });

    for (const it of itemSpecs) {
      await OrderItem.create({
        orderId: order.id,
        productId: it.product.id,
        quantity: it.quantity,
        price: it.price,
      });
    }
    orderCount++;
  }
  log(`Inserted ${orderCount} demo orders.`);
}

/* ────────────────────────────────────────────────────────────── *
 * Main entry points
 * ────────────────────────────────────────────────────────────── */
async function seed() {
  log("Authenticating to database...");
  await sequelize.authenticate();
  log("Syncing model definitions (creates missing tables only)...");
  await sequelize.sync();

  log("Upserting demo users...");
  const usersByEmail = {};
  for (const u of DEMO_USERS) {
    const user = await upsertUser(u);
    usersByEmail[u.email] = user;
  }
  log(`Users ready: ${Object.keys(usersByEmail).length}`);

  log("Upserting categories...");
  const categoryByName = {};
  for (const c of DEMO_CATEGORIES) {
    categoryByName[c.name] = await upsertCategory(c);
  }

  log("Upserting products and category links...");
  const productsBySerial = {};
  for (const p of DEMO_PRODUCTS) {
    const product = await upsertProduct(p, categoryByName);
    productsBySerial[p.serialNumber] = product;
  }
  log(`Products ready: ${Object.keys(productsBySerial).length}`);

  const customer = usersByEmail["selim.cicek@sabanciuniv.edu"];
  const demoUserIds = Object.values(usersByEmail).map((u) => u.id);

  log("Cleaning previous demo workflow data...");
  await clearDemoWorkflowData(demoUserIds, customer.id);

  log("Inserting ratings and comments...");
  await insertReviews(productsBySerial, usersByEmail);

  log("Inserting wishlist...");
  await insertWishlist(productsBySerial, customer);

  log("Inserting orders + order items...");
  await insertOrders(productsBySerial, customer);

  log("Done.");
}

async function undo() {
  log("Authenticating to database...");
  await sequelize.authenticate();

  const demoEmails = DEMO_USERS.map((u) => u.email);
  const demoUsers = await User.findAll({ where: { email: demoEmails } });
  if (!demoUsers.length) {
    log("No demo users found, nothing to undo.");
    return;
  }
  const demoUserIds = demoUsers.map((u) => u.id);
  const customer = demoUsers.find((u) => u.email === "selim.cicek@sabanciuniv.edu");

  log("Removing demo workflow data (orders, comments, ratings, wishlist)...");
  if (customer) {
    await clearDemoWorkflowData(demoUserIds, customer.id);
  }

  log(
    "Demo users and seeded products are preserved — re-run `npm run db:seed` "
    + "to refresh workflow data, or `docker compose down -v` for a full reset."
  );
}

(async () => {
  try {
    if (process.argv.includes("--undo")) {
      await undo();
    } else {
      await seed();
    }
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error("[seed-demo] FAILED:", err);
    try {
      await sequelize.close();
    } catch (_) {}
    process.exit(1);
  }
})();
