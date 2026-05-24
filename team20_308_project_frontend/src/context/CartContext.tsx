/* --------------------------------------------------------------------------
   context/CartContext.tsx
   -------------------------------------------------------------------------- */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

/* --------------------------------------------------------------------------
     1) Tipler
     -------------------------------------------------------------------------- */
// Front-end’in local state’inde tutacağı ürün
export interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number; // her zaman mevcut (default: 1)
}

// Backend’in /api/cart cevabında döndürdüğü item
interface CartItemFromBackend {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
  };
}

// Context’in dışarıya açtığı API
interface CartContextType {
  cartItems: Product[];
  addToCart: (item: Omit<Product, "quantity">, qty?: number) => Promise<void>;
  removeFromCart: (id: number) => Promise<void>;
  fetchCartFromBackend: () => Promise<void>;
  mergeCartAfterLogin: () => Promise<void>;
}

/* --------------------------------------------------------------------------
     2) Yardımcı – sessionId
     -------------------------------------------------------------------------- */
const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2);
    localStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
};

/* --------------------------------------------------------------------------
     3) Context
     -------------------------------------------------------------------------- */
const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<Product[]>([]);

  /* ---------------------------  GET  /api/cart  -------------------------- */
  const fetchCartFromBackend = async () => {
    try {
      const token = localStorage.getItem("token");
      const sessionId = getOrCreateSessionId();

      let url = `${API_BASE}/cart`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        url += `?sessionId=${sessionId}`;
      }

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(await res.text());

      const data: CartItemFromBackend[] = await res.json();

      // Gelen veriyi frontend tipine dönüştür
      const mapped: Product[] = data
        .filter((ci) => ci?.product?.id) // olası bozuk kayıtları at
        .map((ci) => ({
          id: ci.product.id,
          name: ci.product.name,
          price: ci.product.price,
          imageUrl: ci.product.imageUrl,
          quantity: ci.quantity,
        }));

      setCartItems(mapped);
    } catch (err) {
      console.error("Sepet çekme hatası ➜", err);
    }
  };

  /* ---------------------------  POST /cart/add  -------------------------- */
  const addToCart = async (
    product: Omit<Product, "quantity">,
    qty = 1
  ): Promise<void> => {
    // UI’yı anında güncelle
    setCartItems((prev) => {
      const i = prev.findIndex((p) => p.id === product.id);
      if (i >= 0) {
        const updated = [...prev];
        updated[i].quantity += qty;
        return updated;
      }
      return [...prev, { ...product, quantity: qty }];
    });

    // Backend’e gönder
    try {
      const token = localStorage.getItem("token");
      const sessionId = getOrCreateSessionId();

      const payload: Record<string, any> = {
        productId: product.id,
        quantity: qty,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        payload.sessionId = sessionId;
      }

      const res = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to add to cart"); // ❗ burada
      }
    } catch (err) {
      console.error("Failed to add to cart ➜", err);
      await fetchCartFromBackend();
      throw err; // ❗ burada
    }
  };

  /* ---------------------------  DEL /cart/:id  --------------------------- */
  const removeFromCart = async (id: number): Promise<void> => {
    // UI’dan kaldır
    setCartItems((prev) => prev.filter((p) => p.id !== id));

    try {
      const token = localStorage.getItem("token");
      const sessionId = getOrCreateSessionId();

      let url = `${API_BASE}/cart/${id}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else {
        url += `?sessionId=${sessionId}`;
      }

      const res = await fetch(url, { method: "DELETE", headers });
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      console.error("Sepetten silme hatası ➜", err);
      await fetchCartFromBackend(); // senkronize et
    }
  };

  /* -------  Login’den sonra misafir sepetini kullanıcı sepetiyle birleştir  ------- */
  const mergeCartAfterLogin = async () => {
    try {
      const token = localStorage.getItem("token");
      const sessionId = localStorage.getItem("sessionId");
      if (!token || !sessionId) return;

      const res = await fetch(`${API_BASE}/cart/merge`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) throw new Error(await res.text());
      await fetchCartFromBackend(); // yeni sepeti çek
    } catch (err) {
      console.error("mergeCartAfterLogin hatası ➜", err);
    }
  };

  /* ---------------------------  İlk yüklemede  --------------------------- */
  useEffect(() => {
    fetchCartFromBackend();
  }, []);

  /* ---------------------------  Provider  --------------------------- */
  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        fetchCartFromBackend,
        mergeCartAfterLogin,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

/* --------------------------------------------------------------------------
     4) Hook
     -------------------------------------------------------------------------- */
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
