import { useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import CheckoutLayout from "../components/CheckoutLayout";
import OrderSummary from "../components/OrderSummary";
import RequireAuth from "../components/RequireAuth";
import { useCart } from "../context/CartContext";
import { useCartQuote } from "../hooks/useCartQuote";
import { createOrder } from "../services/cartService";
import { clearToken } from "../utils/auth";
import { formatCep } from "../utils/format";

const METHODS = [
  { id: "pix", title: "Pix", text: "5% de desconto. O código é gerado ao finalizar o pedido." },
  { id: "card", title: "Cartão de crédito", text: "Em 1x sem juros. Simulação: aprovado na hora e nenhum dado de cartão é pedido." },
  { id: "boleto", title: "Boleto bancário", text: "Linha digitável gerada ao finalizar (simulada)." },
];

function PaymentContent() {
  const navigate = useNavigate();
  const { items, checkout, finishOrder } = useCart();
  const [method, setMethod] = useState("pix");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const finished = useRef(false); // evita redirecionar para o carrinho quando ele é esvaziado de propósito

  const address = checkout.address;
  const { quote, error: quoteError } = useCartQuote(items, checkout.coupon, address?.zip_code || checkout.cep);

  if (!finished.current) {
    if (items.length === 0) return <Navigate to="/cart" replace />;
    if (!address) return <Navigate to="/checkout/delivery" replace />;
  }

  async function finish() {
    setSending(true);
    setError("");
    try {
      const order = await createOrder({ items, coupon: checkout.coupon, paymentMethod: method, address });
      finished.current = true;
      navigate(`/checkout/confirmation/${order.id}`, { replace: true });
      finishOrder();
    } catch (err) {
      if (err.status === 401) {
        clearToken();
        navigate("/login", { state: { from: "/checkout/payment" } });
        return;
      }
      setError(err.message || "Não foi possível finalizar o pedido.");
    } finally {
      setSending(false);
    }
  }

  return (
    <CheckoutLayout step="payment">
      <div className="checkout-grid">
        <div className="checkout-main">
          <section className="panel">
            <h1>Entrega</h1>
            <p className="address-box">
              <span>
                {address.street}, {address.number}
                {address.complement ? ` — ${address.complement}` : ""}<br />
                {address.district} · {address.city}/{address.state} · CEP {formatCep(address.zip_code)}
              </span>
              <Link to="/checkout/delivery" className="link-button">Alterar</Link>
            </p>
          </section>

          <section className="panel">
            <h1>Forma de pagamento</h1>
            <div className="choice-list" role="radiogroup" aria-label="Forma de pagamento">
              {METHODS.map((m) => (
                <label key={m.id} className="choice">
                  <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
                  <div>
                    <strong>{m.title}</strong>
                    <span>{m.text}</span>
                  </div>
                </label>
              ))}
            </div>
            {(error || quoteError) && <p className="notice notice--error" role="alert" style={{ marginTop: 16 }}>{error || quoteError}</p>}
          </section>
        </div>

        <OrderSummary quote={quote} method={method}>
          <button type="button" className="btn btn--primary" onClick={finish} disabled={!quote || sending}>
            {sending ? "Finalizando..." : "Finalizar pedido"}
          </button>
        </OrderSummary>
      </div>
    </CheckoutLayout>
  );
}

export default function PaymentPage() {
  return (
    <RequireAuth>
      <PaymentContent />
    </RequireAuth>
  );
}
