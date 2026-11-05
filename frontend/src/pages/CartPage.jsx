import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import CheckoutLayout from "../components/CheckoutLayout";
import OrderSummary from "../components/OrderSummary";
import { CopyIcon, MinusIcon, PlusIcon, TrashIcon, WhatsAppIcon } from "../components/icons";
import { useCart } from "../context/CartContext";
import { useCartQuote } from "../hooks/useCartQuote";
import { quoteCart } from "../services/cartService";
import { getProduct } from "../services/productService";
import { getSession } from "../utils/auth";
import { formatCep, formatPrice } from "../utils/format";
import { decodeCart, encodeCart } from "../utils/shareCart";

function OptionLine({ title, value }) {
  const isColor = typeof value === "string" && value.startsWith("#");
  return (
    <li>
      {title}: {isColor && <span className="dot" style={{ background: value }} />}
      {value}
    </li>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { items, setQuantity, removeItem, replaceItems, checkout, setCheckout } = useCart();
  const { quote, error } = useCartQuote(items, checkout.coupon, checkout.cep);

  const [cepInput, setCepInput] = useState(formatCep(checkout.cep || ""));
  const [couponInput, setCouponInput] = useState("");
  const [cepError, setCepError] = useState("");
  const [couponError, setCouponError] = useState("");
  const [busy, setBusy] = useState(""); // "cep" | "coupon" | ""
  const [copied, setCopied] = useState(false);

  // Link de carrinho compartilhado: /cart?s=...  (recarrega os produtos da API)
  useEffect(() => {
    const shared = params.get("s");
    if (!shared) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const loaded = [];
        for (const entry of decodeCart(shared)) {
          const product = await getProduct(entry.id);
          loaded.push({
            productId: product.id,
            name: product.name,
            image: product.images[0]?.src ?? null,
            options: entry.o,
            quantity: entry.q,
          });
        }
        if (!cancelled && loaded.length) replaceItems(loaded);
      } catch {
        /* link inválido: ignora e mostra o carrinho atual */
      }
      if (!cancelled) setParams({}, { replace: true });
    })();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shareUrl = () =>
    `${window.location.origin}/cart?s=${encodeCart(items.map((i) => ({ id: i.productId, q: i.quantity, o: i.options })))}`;

  async function copyLink() {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o link do carrinho:", url);
    }
  }

  async function applyCep(event) {
    event.preventDefault();
    const digits = cepInput.replace(/\D/g, "");
    setCepError("");
    if (digits.length !== 8) {
      setCepError("Digite um CEP válido com 8 números.");
      return;
    }
    setBusy("cep");
    try {
      await quoteCart({ items, coupon: checkout.coupon, cep: digits }); // valida antes de guardar
      setCheckout({ cep: digits });
    } catch (err) {
      setCepError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function applyCoupon(event) {
    event.preventDefault();
    const code = couponInput.trim();
    setCouponError("");
    if (!code) {
      setCouponError("Digite o código do cupom.");
      return;
    }
    setBusy("coupon");
    try {
      await quoteCart({ items, coupon: code, cep: checkout.cep });
      setCheckout({ coupon: code.toUpperCase() });
      setCouponInput("");
    } catch (err) {
      setCouponError(err.message);
    } finally {
      setBusy("");
    }
  }

  function goOn() {
    navigate(getSession() ? "/checkout/delivery" : "/login", getSession() ? undefined : { state: { from: "/checkout/delivery" } });
  }

  if (items.length === 0) {
    return (
      <CheckoutLayout step="cart">
        <div className="panel" style={{ textAlign: "center" }}>
          <h1>Seu carrinho está vazio</h1>
          <p>Que tal dar uma olhada nos produtos?</p>
          <Link className="btn btn--outline" to="/products">Buscar produtos</Link>
        </div>
      </CheckoutLayout>
    );
  }

  return (
    <CheckoutLayout step="cart">
      <div className="checkout-grid">
        <div className="checkout-main">
          {error && <p className="notice notice--error" role="alert">{error}</p>}

          <ul className="cart-items">
            {items.map((item, index) => {
              const line = quote?.items[index];
              return (
                <li key={item.key} className="cart-item">
                  <div className="cart-item__image">{item.image && <img src={item.image} alt="" />}</div>

                  <div className="cart-item__info">
                    <p className="cart-item__name">{item.name}</p>
                    <ul className="cart-item__details">
                      {Object.entries(item.options || {}).map(([title, value]) => (
                        <OptionLine key={title} title={title} value={value} />
                      ))}
                      <li>Vendido e entregue por: <b>Loja</b></li>
                    </ul>
                  </div>

                  <div className="cart-item__side">
                    <div className="qty">
                      <button
                        type="button"
                        aria-label={item.quantity === 1 ? "Remover do carrinho" : "Diminuir quantidade"}
                        onClick={() => (item.quantity === 1 ? removeItem(item.key) : setQuantity(item.key, item.quantity - 1))}
                      >
                        {item.quantity === 1 ? <TrashIcon /> : <MinusIcon />}
                      </button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button type="button" aria-label="Aumentar quantidade" onClick={() => setQuantity(item.key, item.quantity + 1)}>
                        <PlusIcon />
                      </button>
                    </div>

                    {line && (
                      <>
                        {line.unit_price_final < line.unit_price && (
                          <span className="price-old">{formatPrice(line.unit_price * line.quantity)}</span>
                        )}
                        <span className="price-final">{formatPrice(line.unit_price_final * line.quantity)}</span>
                        <span className="price-pix">ou <b>{formatPrice(line.unit_price_pix * line.quantity)}</b> no Pix</span>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="cart-share">
            <a
              className="btn btn--outline"
              href={`https://wa.me/?text=${encodeURIComponent(`Olha o meu carrinho: ${shareUrl()}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Compartilhar carrinho <WhatsAppIcon />
            </a>
            <button type="button" className="btn btn--outline" onClick={copyLink}>
              {copied ? "Link copiado!" : "Copiar link"} <CopyIcon />
            </button>
          </div>

          <section className="cart-field">
            <h2>Calcule o frete</h2>
            <form className="cart-input" onSubmit={applyCep}>
              <input
                inputMode="numeric"
                placeholder="Digite o CEP"
                aria-label="CEP"
                value={cepInput}
                onChange={(e) => setCepInput(formatCep(e.target.value))}
              />
              <button type="submit" disabled={busy === "cep"}>Calcular</button>
            </form>
            {cepError && <p className="cart-field__error" role="alert">{cepError}</p>}
            {quote?.shipping && (
              <p className="cart-field__hint">
                Frete para {formatCep(quote.shipping.cep)}:{" "}
                <b>{quote.shipping.price === 0 ? "Grátis" : formatPrice(quote.shipping.price)}</b> · até {quote.shipping.days} dias úteis
              </p>
            )}
            <a
              className="cart-field__link"
              href="https://buscacepinter.correios.com.br/app/endereco/index.php"
              target="_blank"
              rel="noopener noreferrer"
            >
              Não sei meu CEP
            </a>
          </section>

          <section className="cart-field cart-field--coupon">
            <h2>Cupom de desconto</h2>
            {checkout.coupon ? (
              <p className="cart-field__hint">
                Cupom <b>{checkout.coupon}</b> aplicado.{" "}
                <button type="button" className="link-button" onClick={() => setCheckout({ coupon: "" })}>Remover</button>
              </p>
            ) : (
              <form className="cart-input" onSubmit={applyCoupon}>
                <input placeholder="Digite o cupom" aria-label="Cupom de desconto" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} />
                <button type="submit" disabled={busy === "coupon"}>Adicionar</button>
              </form>
            )}
            {couponError && <p className="cart-field__error" role="alert">{couponError}</p>}
            {!checkout.coupon && <p className="cart-field__hint">Para testar: BEMVINDO10, DESCONTO20 ou FRETEGRATIS.</p>}
          </section>
        </div>

        <OrderSummary quote={quote} after={<Link className="summary-more" to="/products">Buscar mais produtos</Link>}>
          <button type="button" className="btn btn--primary" onClick={goOn} disabled={!quote || Boolean(error)}>
            Continuar
          </button>
        </OrderSummary>
      </div>
    </CheckoutLayout>
  );
}
