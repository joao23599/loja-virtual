import { Link } from "react-router-dom";
import CheckoutSteps from "./CheckoutSteps";
import { LockIcon } from "./icons";
import "../styles/checkout.css";

// Cabeçalho enxuto (logo + etapas + "ambiente seguro"), sem menu nem busca, para não distrair da compra
export default function CheckoutLayout({ step, children }) {
  return (
    <div className="checkout">
      <header className="checkout__header">
        <Link to="/products" className="checkout__logo">Loja</Link>
        <CheckoutSteps current={step} />
        <span className="checkout__secure"><LockIcon size={16} /> Ambiente seguro</span>
      </header>
      <main className="checkout__main">{children}</main>
      <footer className="checkout__footer">Projeto de estudo: pagamentos e frete são simulados.</footer>
    </div>
  );
}
