// src/App.tsx
import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./routes/AppRouter";
import "./styles/PendingComments.css";

import Header from "./components/Header";
import PmHeader from "./components/pmHeader";
import SmHeader from "./components/SmHeader";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { WishlistProvider } from "./context/WishlistContext";

/* ------------------------------------------------------------- */
/* Küresel şablon — Header rol’e göre, altı da tüm Routes        */
/* ------------------------------------------------------------- */
const Layout: React.FC = () => {
  const { role } = useAuth();

  const header =
    role === "sales_manager" ? (
      <SmHeader />
    ) : role === "product_manager" ? (
      <PmHeader />
    ) : (
      <Header />
    );

  return (
    <>
      {header}

      <div className="main-container">
        <AppRouter />
      </div>
    </>
  );
};

/* ------------------------------------------------------------- */
/* Sağ-sol tüm provider’lar                                      */
/* ------------------------------------------------------------- */
const App: React.FC = () => (
  <ToastProvider>
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <BrowserRouter>
            <Layout />
          </BrowserRouter>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  </ToastProvider>
);

export default App;
