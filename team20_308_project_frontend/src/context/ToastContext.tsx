// src/context/ToastContext.tsx
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import ToastPopup from "../components/ToastPopup";

/* ------------------------------------------------------------------ */
/*  Types & helpers                                                   */
/* ------------------------------------------------------------------ */
export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export interface ToastContextType {
  /** Yeni isim – tüm yeni kodlarda bunu kullan */
  addToast: (msg: string, type?: ToastType) => void;

  /** Geriye uyumluluk için alias (eski kodlarda showToast vardı) */
  showToast?: (msg: string, type?: ToastType) => void;
}

/* ------------------------------------------------------------------ */
/*  Context setup                                                     */
/* ------------------------------------------------------------------ */
const ToastContext = createContext<ToastContextType | undefined>(undefined);
let idCounter = 1;

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /* ------- tek bir toast ekleme ----------------------------------- */
  const addToast = useCallback((message: string, type: ToastType = "info") => {
    setToasts((prev) => [...prev, { id: idCounter++, message, type }]);
  }, []);

  /* ------- alias: eski showToast adını da destekle ---------------- */
  const showToast = addToast; // legacy alias

  /* ------- toast kendini kapattığında listeden düşsün ------------- */
  const dismiss = (id: number) =>
      setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
      <ToastContext.Provider value={{ addToast, showToast }}>
        {children}

        {/* Aktif toast'lar */}
        <div className="toast-container">
          {toasts.map((t) => (
              <ToastPopup
                  key={t.id}
                  message={t.message}
                  type={t.type}
                  onClose={() => dismiss(t.id)}
              />
          ))}
        </div>
      </ToastContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/*  Convenience hook                                                  */
/* ------------------------------------------------------------------ */
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within <ToastProvider>");
  }
  return ctx;
};
