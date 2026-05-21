import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiFetch } from "../api/api";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export interface WishlistItem {
  productId: number;
  name: string;
  imageUrl: string;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  fetchWishlist: () => Promise<void>;
  addToWishlist: (item: WishlistItem) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  clearWishlist: () => void;
  isInWishlist: (productId: number) => boolean;
}

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */
const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  /* ————————————————————— Helpers ————————————————————— */
  const hasToken = () => !!localStorage.getItem("token");

  /* Sunucudan kullanıcının wishlist’ini çek */
  const fetchWishlist = async () => {
    if (!hasToken()) {
      setWishlist([]);
      return;
    }
    try {
      const items = await apiFetch<WishlistItem[]>("/wishlist");
      setWishlist(items);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
    }
  };

  /* Ürün ekle */
  const addToWishlist = async (item: WishlistItem) => {

    try {
      await apiFetch("/wishlist", {
        method: "POST",
        body: JSON.stringify({ productId: item.productId }),
      });
      setWishlist((prev) =>
        prev.some((i) => i.productId === item.productId)
          ? prev
          : [...prev, item]
      );
    } catch (err) {
      console.error("Error adding to wishlist:", err);
    }
  };

  /* Ürün kaldır */
  const removeFromWishlist = async (productId: number) => {
    try {
      await apiFetch(`/wishlist/${productId}`, { method: "DELETE" });
      setWishlist((prev) => prev.filter((i) => i.productId !== productId));
    } catch (err) {
      console.error("Error removing from wishlist:", err);
    }
  };

  /* Logout sonrası local state’i temizle */
  const clearWishlist = () => setWishlist([]);

  /* Yardımcı */
  const isInWishlist = (pid: number) =>
    wishlist.some((i) => i.productId === pid);

  /* 1) İlk mount’ta token varsa listeyi çek */
  useEffect(() => {
    hasToken() && fetchWishlist();
  }, []);

  /* 2) Diğer sekmelerdeki login/logout’u yakala */
  useEffect(() => {
    const handleStorage = () => {
      hasToken() ? fetchWishlist() : clearWishlist();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        fetchWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};
