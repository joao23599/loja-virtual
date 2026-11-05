import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CheckoutLayout from "../components/CheckoutLayout";
import RequireAuth from "../components/RequireAuth";
import { CheckIcon, CopyIcon } from "../components/icons";
import { getOrder } from "../services/cartService";
import { clearToken } from "../utils/auth";
import { formatCep, formatPrice } from "../utils/format";

const METHOD_LABEL = { pix: "Pix", card: "Cartão de crédito", boleto: "Boleto bancário" };

function ConfirmationContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | notFound | error
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOrder(id)
      .then((data) => {
        if (cancelled) return;
        setOrder(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.status === 401) {
          clearToken();
          navigate("/login", { replace: true, state: { from: `/checkout/confirmation/${id}` } });
        } else {
          setStatus(err.status === 404 ? "notFound" : "error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(order.payment_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o código:", order.payment_code);
    }
  }

  if (status !== "ready") {
    const messages = {
      loading: "Carregando pedido...",
      notFound: "Pedido não encontrado.",
      error: "Não foi possível carregar o pedido.",
    };
    return (
      <CheckoutLayout step="confirmation">
        <p className="panel" role={status === "loading" ? "status" : "alert"}>{messages[status]}</p>
      </CheckoutLayout>
    );
  }

  const paid = order.status === "paid";
  const { address } = order;

  return (
    <CheckoutLayout step="confirmation">
      <div className="checkout-grid">
        <div className="checkout-main">
          <div className={`confirm-banner ${paid ? "confirm-banner--paid" : "confirm-banner--wait"}`}>
            <CheckIcon size={40} />
            <div>
              <h1>Pedido #{order.id} confirmado!</h1>
              <p>
                {paid
                  ? "Pagamento aprovado (simulado). Já estamos preparando o seu pedido."
                  : "Falta pouco: finalize o pagamento abaixo para liberar o envio (simulado)."}
              </p>
              <p>{new Date(order.created_at).toLocaleString("pt-BR")} · {METHOD_LABEL[order.payment_method]}</p>
            </div>
          </div>

          {order.payment_code && (
            <section className="panel">
              <h2>{order.payment_method === "pix" ? "Pix copia e cola (simulado)" : "Linha digitável do boleto (simulada)"}</h2>
              <div className="code-box">
                <input readOnly value={order.payment_code} aria-label="Código de pagamento" onFocus={(e) => e.target.select()} />
                <button type="button" onClick={copyCode}>{copied ? "Copiado!" : "Copiar"} <CopyIcon /></button>
              </div>
            </section>
          )}

          <section className="panel">
            <h2>Itens do pedido</h2>
            <ul className="order-items">
              {order.items.map((item, index) => (
                <li key={`${item.product_id}-${index}`}>
                  {item.image ? <img src={item.image} alt="" /> : <span style={{ width: 56 }} />}
                  <div className="grow">
                    {item.name}
                    {item.options_text && <small>{item.options_text}</small>}
                    <small>Quantidade: {item.quantity}</small>
                  </div>
                  <b>{formatPrice(item.unit_price_final * item.quantity)}</b>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h2>Entrega</h2>
            <p className="address-box">
              <span>
                {address.street}, {address.number}
                {address.complement ? ` — ${address.complement}` : ""}<br />
                {address.district} · {address.city}/{address.state} · CEP {formatCep(address.zip_code)}<br />
                Chega em até <b>{order.shipping.days} dias úteis</b>
              </span>
            </p>
          </section>
        </div>

        <aside className="summary-col">
          <div className="summary">
            <dl className="summary__lines">
              <div><dt>Produtos</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              {order.product_discount > 0 && <div><dt>Desconto em produtos</dt><dd>-{formatPrice(order.product_discount)}</dd></div>}
              {order.coupon && order.coupon.discount > 0 && <div><dt>Cupom {order.coupon.code}</dt><dd>-{formatPrice(order.coupon.discount)}</dd></div>}
              <div><dt>Frete</dt><dd>{order.shipping.price === 0 ? "Grátis" : formatPrice(order.shipping.price)}</dd></div>
              {order.pix_discount > 0 && <div><dt>Desconto no Pix</dt><dd>-{formatPrice(order.pix_discount)}</dd></div>}
            </dl>
            <div className="summary__total">
              <span className="summary__total-label">Total</span>
              <span className="summary__total-value"><strong>{formatPrice(order.total)}</strong></span>
            </div>
            <div className="actions" style={{ marginTop: 20 }}>
              <Link className="btn btn--primary" to="/products">Continuar comprando</Link>
            </div>
          </div>
        </aside>
      </div>
    </CheckoutLayout>
  );
}

export default function ConfirmationPage() {
  return (
    <RequireAuth>
      <ConfirmationContent />
    </RequireAuth>
  );
}
