// src/services/productService.ts
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5002/api";

// Ürün tipi
export interface Product {
  id: number;
  name: string;
  model?: string;
  serialNumber: string;
  price: number;
  cost?: number;
  imageUrl?: string;
  quantityInStocks?: number;
  [key: string]: any;
}

/**
 * Ürünleri getirir. sort ve opsiyonel categoryId query parametreleri alır.
 */
export async function fetchProducts(
  sort?: string,
  categoryId?: number | null,
  includeUnpriced = false
): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (sort) params.set("sort", sort);
    if (categoryId != null) params.set("categoryId", categoryId.toString());
    if (includeUnpriced) params.set("includeUnpriced", "1");

    const url = `${API_BASE_URL}/products${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `fetchProducts failed: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const data = await response.json();
    // Gelen snake_case alanları camelCase’e map’liyoruz
    return (data as any[]).map((p) => ({
      id: p.id,
      name: p.name,
      model: p.model,
      serialNumber: p.serial_number ?? p.serialNumber,
      price: p.price,
      imageUrl: p.image_url ?? p.imageUrl,
      quantityInStocks: p.quantity_in_stocks ?? p.quantityInStocks,
      ...p,
    }));
  } catch (error) {
    console.error("fetchProducts error:", error);
    return [];
  }
}

/**
 * Belirli bir ürünün detayını ID ile getirir
 */
export async function fetchProductById(id: number): Promise<Product> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error(`Product not found (ID=${id})`);
    }
    const p = await response.json();
    return {
      id: p.id,
      name: p.name,
      model: p.model,
      serialNumber: p.serial_number ?? p.serialNumber,
      price: p.price,
      imageUrl: p.image_url ?? p.imageUrl,
      quantityInStocks: p.quantity_in_stocks ?? p.quantityInStocks,
      ...p,
    };
  } catch (error) {
    console.error(`fetchProductById error (ID=${id}):`, error);
    throw error;
  }
}

export async function updateProductStock(
    id: number,
    newStock: number
): Promise<boolean> {
  try {
    const token = localStorage.getItem("token")!;
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantityInStocks: newStock }),
    });
    return res.ok;
  } catch (e) {
    console.error("updateProductStock error:", e);
    return false;
  }
}


/** ➕ ürün oluştur */
export async function createProduct(p: any) {
  const token = localStorage.getItem("token")!;
  // boş string → undefined
  const cleaned = Object.fromEntries(
      Object.entries(p).filter(([, v]) => v !== "" && v !== null)
  );

  const res = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(cleaned),
  });
  if (!res.ok) throw new Error((await res.json()).message);
}
/** 🗑 ürün sil */
export async function deleteProduct(id: number): Promise<void> {
  const token = localStorage.getItem("token")!;
  const res = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Delete failed");
}

// src/services/productService.ts
const API = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

export interface ProductBrief {
  id: number;
  name: string;
  serialNumber: string;
}

export interface ProductBrief { id: number; name: string; serialNumber: string; }

export const fetchProductsBrief = async (): Promise<ProductBrief[]> => {
  const r = await fetch(`${API}/products?includeUnpriced=true`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};



