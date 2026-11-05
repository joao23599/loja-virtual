import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProductsPage from "./pages/ProductsPage";
import ProductViewPage from "./pages/ProductViewPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import CartPage from "./pages/CartPage";
import DeliveryPage from "./pages/DeliveryPage";
import PaymentPage from "./pages/PaymentPage";
import ConfirmationPage from "./pages/ConfirmationPage";

function NotFoundPage() {
  return (
    <Layout>
      <p style={{ padding: "64px 0", textAlign: "center" }}>Página não encontrada.</p>
    </Layout>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/products" replace />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/product/:id" element={<ProductViewPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout/delivery" element={<DeliveryPage />} />
      <Route path="/checkout/payment" element={<PaymentPage />} />
      <Route path="/checkout/confirmation/:id" element={<ConfirmationPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
