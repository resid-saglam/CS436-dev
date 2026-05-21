// src/routes/AppRouter.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ---------- Genel sayfalar ---------- */
import MainPage from "../pages/MainPage";
import ProfilePage from "../pages/ProfilePage";
import ProductPage from "../pages/ProductPage";
import BasketPage from "../pages/BasketPage";
import SearchResultsPage from "../pages/SearchResultPage";
import CheckoutPage from "../pages/CheckoutPage";
import OrderHistoryPage from "../pages/OrderHistoryPage";
import OrderSuccessPage from "../pages/OrderSuccessPage";
import WishlistPage from "../pages/WishlistPage";

/* ---------- Product Manager ---------- */
import PmPage from "../pages/pmPage";
import PMInventoryPage from "../pages/PMInventoryPage";
import PmOrdersPage from "../pages/pmOrdersPage";
import PMCommentsPage from "../pages/PMCommentsPage";
import CategoriesPage from "../pages/categoriesPage";

/* ---------- Sales Manager ------------ */
import SmPage from "../pages/smPage";
import SmSetPricesPage from "../pages/SmSetPricesPage";
import SmApplyDiscountsPage from "../pages/SmApplyDiscountsPage";
import SmProfitLossPage from "../pages/SmProfitLossPage";
import SmInvoicesPage from "../pages/SmInvoicesPage";
import SmRefundRequestsPage from "../pages/SmRefundRequestsPage";

/* ---------- Yetki kontrolü ----------- */
import RequireRole from "../components/RequireRole";

/* Ana rota: login’li kullanıcıyı rolüne göre atar */
const HomeRedirect: React.FC = () => {
  const { isLoggedIn, role } = useAuth();

  if (isLoggedIn) {
    if (role === "sales_manager")
      return <Navigate to="/sales-dashboard" replace />;
    if (role === "product_manager") return <Navigate to="/pm" replace />;
  }
  return <MainPage />;
};

const AppRouter = () => (
  <Routes>
    {/* ---------- Genel ---------- */}
    <Route path="/" element={<HomeRedirect />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/product/:id" element={<ProductPage />} />
    <Route path="/basket" element={<BasketPage />} />
    <Route path="/checkout" element={<CheckoutPage />} />
    <Route path="/search" element={<SearchResultsPage />} />
    <Route path="/orders" element={<OrderHistoryPage />} />
    <Route path="/order-success" element={<OrderSuccessPage />} />
    <Route path="/wishlist" element={<WishlistPage />} />
    <Route path="/pm/categories" element={<CategoriesPage />} />

    {/* ---------- Product Manager ---------- */}
    <Route
      path="/pm"
      element={
        <RequireRole roles={["product_manager"]}>
          <PmPage />
        </RequireRole>
      }
    />
    <Route
      path="/pm/inventory"
      element={
        <RequireRole roles={["product_manager"]}>
          <PMInventoryPage />
        </RequireRole>
      }
    />
    <Route
      path="/pm/orders"
      element={
        <RequireRole roles={["product_manager"]}>
          <PmOrdersPage />
        </RequireRole>
      }
    />
    <Route
      path="/pm/comments"
      element={
        <RequireRole roles={["product_manager"]}>
          <PMCommentsPage />
        </RequireRole>
      }
    />

    {/* ---------- Sales Manager ------------ */}
    <Route
      path="/sales-dashboard"
      element={
        <RequireRole roles={["sales_manager"]}>
          <SmPage />
        </RequireRole>
      }
    />
    <Route
      path="/sm/set-prices"
      element={
        <RequireRole roles={["sales_manager"]}>
          <SmSetPricesPage />
        </RequireRole>
      }
    />
    <Route
      path="/sm/apply-discounts"
      element={
        <RequireRole roles={["sales_manager"]}>
          <SmApplyDiscountsPage />
        </RequireRole>
      }
    />
    <Route
      path="/sm/profit-loss"
      element={
        <RequireRole roles={["sales_manager"]}>
          <SmProfitLossPage />
        </RequireRole>
      }
    />
    <Route
      path="/sm/invoices"
      element={
        <RequireRole roles={["sales_manager"]}>
          <SmInvoicesPage />
        </RequireRole>
      }
    />
    <Route
      path="/sm/refund-requests"
      element={
        <RequireRole roles={["sales_manager"]}>
          <SmRefundRequestsPage />
        </RequireRole>
      }
    />
  </Routes>
);

export default AppRouter;
