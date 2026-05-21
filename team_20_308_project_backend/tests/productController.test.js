const request = require("supertest");
const app = require("../src/app");

describe("Product Controller Tests", () => {
  it("should fetch all products successfully", async () => {
    const res = await request(app).get("/api/products");

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
it("should fetch a product by ID", async () => {
  const productId = 1;
  const res = await request(app).get(`/api/products/${productId}`);

  expect(res.statusCode).toEqual(200);
  expect(res.body).toHaveProperty("id", productId);
});
it("should return 404 for non-existing product", async () => {
  const res = await request(app).get("/api/products/99999");

  expect(res.statusCode).toEqual(404);
  expect(res.body).toHaveProperty("message", "Ürün bulunamadı!");
});
it("should create a new product", async () => {
  const newProduct = {
    name: "Test Product",
    model: "Model 123",
    serialNumber: "SN123456",
    description: "Test description",
    quantityInStocks: 10,
    price: 199.99,
    warrantyStatus: "true",
    distributorInfo: "Test Distributor",
    categoryIds: [], // veya test için boş bırak
  };

  const res = await request(app).post("/api/products").send(newProduct);

  expect(res.statusCode).toEqual(201);
  expect(res.body).toHaveProperty("product");
  expect(res.body.product).toHaveProperty("name", "Test Product");
});
it("should not create product with missing fields", async () => {
  const incompleteProduct = {
    name: "Incomplete Product",
  };

  const res = await request(app).post("/api/products").send(incompleteProduct);

  expect(res.statusCode).toEqual(400);
  expect(res.body).toHaveProperty(
    "message",
    "Lütfen gerekli alanları doldurun!"
  );
});
describe("Product Controller Tests", () => {
  it("should fetch all products successfully", async () => {
    const res = await request(app).get("/api/products");
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should return empty list if no products", async () => {
    const res = await request(app).get(
      "/api/products?search=nonexistentproductxyz"
    );
    expect(res.statusCode).toEqual(200);
    expect(res.body.length).toBe(0);
  });

  it("should fetch a product by ID", async () => {
    const res = await request(app).get("/api/products/1"); // id 1 olan ürün varsayımı
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("id", 1);
  });

  it("should return 404 for non-existing product", async () => {
    const res = await request(app).get("/api/products/99999");
    expect(res.statusCode).toEqual(404);
  });

  it("should return 404 for deleted product", async () => {
    const res = await request(app).get("/api/products/123456789");
    expect(res.statusCode).toEqual(404);
  });

  it("should create a new product successfully", async () => {
    const newProduct = {
      name: "Test Product",
      model: "Model 123",
      serialNumber: "SNTEST" + Date.now(),
      description: "Test description",
      quantityInStocks: 10,
      price: 199.99,
      warrantyStatus: true,
      distributorInfo: "Test Distributor",
    };
    const res = await request(app).post("/api/products").send(newProduct);
    expect(res.statusCode).toEqual(201);
    expect(res.body.product).toHaveProperty("name", "Test Product");
  });

  it("should reject product creation with missing fields", async () => {
    const incompleteProduct = {
      name: "Incomplete Product",
    };
    const res = await request(app)
      .post("/api/products")
      .send(incompleteProduct);
    expect(res.statusCode).toEqual(400);
  });

  it("should reject duplicate serialNumber", async () => {
    const duplicateProduct = {
      name: "Duplicate Product",
      model: "Model Duplicate",
      serialNumber: "SN1234567",
      description: "Trying duplicate serial",
      quantityInStocks: 5,
      price: 299.99,
      warrantyStatus: false,
      distributorInfo: "Duplicate Distributor",
    };
    const res = await request(app).post("/api/products").send(duplicateProduct);
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it("should reject product with negative price", async () => {
    const product = {
      name: "Negative Price Product",
      model: "Negative Model",
      serialNumber: "NEG123" + Date.now(),
      description: "Invalid price",
      quantityInStocks: 10,
      price: -100,
      warrantyStatus: true,
      distributorInfo: "Invalid Distributor",
    };
    const res = await request(app).post("/api/products").send(product);
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });

  it("should reject product with negative quantityInStocks", async () => {
    const product = {
      name: "Negative Stock Product",
      model: "NegativeStockModel",
      serialNumber: "NEGSTOCK" + Date.now(),
      description: "Invalid stock",
      quantityInStocks: -5,
      price: 250,
      warrantyStatus: true,
      distributorInfo: "Invalid Stock Distributor",
    };
    const res = await request(app).post("/api/products").send(product);
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});

it("should sort products by price ascending", async () => {
  const res = await request(app).get("/api/products?sort=priceAsc");
  expect(res.statusCode).toEqual(200);
  expect(Array.isArray(res.body)).toBe(true);
});

it("should sort products by price descending", async () => {
  const res = await request(app).get("/api/products?sort=priceDesc");
  expect(res.statusCode).toEqual(200);
  expect(Array.isArray(res.body)).toBe(true);
});

it("should sort products by popularity", async () => {
  const res = await request(app).get("/api/products?sort=popularity");
  expect(res.statusCode).toEqual(200);
  expect(Array.isArray(res.body)).toBe(true);
});

it("should sort products by rating ascending", async () => {
  const res = await request(app).get("/api/products?sort=ratingAsc");
  expect(res.statusCode).toEqual(200);
  expect(Array.isArray(res.body)).toBe(true);
});

it("should sort products by rating descending", async () => {
  const res = await request(app).get("/api/products?sort=ratingDesc");
  expect(res.statusCode).toEqual(200);
  expect(Array.isArray(res.body)).toBe(true);
});

it("should fetch products by category", async () => {
  const categoryId = 1;
  const res = await request(app).get(`/api/products?categoryId=${categoryId}`);
  expect(res.statusCode).toEqual(200);
  expect(Array.isArray(res.body)).toBe(true);
});

it("should return empty list for non-existing category", async () => {
  const res = await request(app).get("/api/products?categoryId=999999");
  expect(res.statusCode).toEqual(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBe(0);
});

it("should not fetch deleted product", async () => {
  // Önce ürün oluştur
  const newProduct = {
    name: "Delete Test Product",
    model: "DeleteModel",
    serialNumber: "DELETE" + Date.now(),
    description: "To be deleted",
    quantityInStocks: 5,
    price: 150,
    warrantyStatus: true,
    distributorInfo: "Delete Distributor",
  };
  const createRes = await request(app).post("/api/products").send(newProduct);
  const createdId = createRes.body.product.id;

  await request(app).delete(`/api/products/${createdId}`);

  const fetchRes = await request(app).get(`/api/products/${createdId}`);
  expect(fetchRes.statusCode).toEqual(404);
});

it("should update a product successfully", async () => {
  const product = {
    name: "Update Test Product",
    model: "UpdateModel",
    serialNumber: "UPDATE" + Date.now(),
    description: "To be updated",
    quantityInStocks: 5,
    price: 199,
    warrantyStatus: true,
    distributorInfo: "Update Distributor",
  };
  const createRes = await request(app).post("/api/products").send(product);
  const createdId = createRes.body.product.id;

  const updateRes = await request(app)
    .put(`/api/products/${createdId}`)
    .send({ name: "Updated Product Name" });

  expect(updateRes.statusCode).toEqual(200);
  expect(updateRes.body.product.name).toEqual("Updated Product Name");
});

it("should return 404 when updating non-existing product", async () => {
  const res = await request(app)
    .put("/api/products/999999")
    .send({ name: "Should Not Update" });

  expect(res.statusCode).toEqual(404);
});
