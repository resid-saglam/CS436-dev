const API = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

export interface Category {
  id: number;
  name: string;
  icon: string;
  Products?: { id: number; name: string; serialNumber: string }[];
}

export const fetchCategories = async (withProducts = false): Promise<Category[]> => {
  const r = await fetch(`${API}/categories?withProducts=${withProducts}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

/* CREATE (icon parametresi eklendi) */
export const createCategory = async (name: string, icon: string) => {
  const r = await fetch(`${API}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, icon }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

export const deleteCategory = async (id: number) => {
  const r = await fetch(`${API}/categories/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(await r.text());
};

export const addProductsToCategory = async (id: number, productIds: number[]) => {
  const r = await fetch(`${API}/categories/${id}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productIds }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

export const removeProductsFromCategory = async (id: number, productIds: number[]) => {
  const r = await fetch(`${API}/categories/${id}/products/remove`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productIds }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};
