import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import CheckoutLayout from "../components/CheckoutLayout";
import OrderSummary from "../components/OrderSummary";
import RequireAuth from "../components/RequireAuth";
import { useCart } from "../context/CartContext";
import { useCartQuote } from "../hooks/useCartQuote";
import { lookupCep } from "../services/cepService";
import { formatCep, formatPrice } from "../utils/format";

const digitsOf = (value) => String(value ?? "").replace(/\D/g, "");

const STATUS_TEXT = {
  idle: "Digite o CEP e preenchemos o endereço para você.",
  loading: "Buscando endereço...",
  found: "Endereço encontrado! Confira e informe o número.",
  foundPartial: "CEP de cidade: informe a rua, o bairro e o número.",
  notFound: "CEP não encontrado. Confira os números ou preencha o endereço manualmente.",
  unavailable: "Não foi possível buscar o endereço agora. Preencha manualmente.",
};

function DeliveryContent() {
  const navigate = useNavigate();
  const { items, checkout, setCheckout } = useCart();
  const saved = checkout.address || {};

  const [form, setForm] = useState({
    zip_code: formatCep(saved.zip_code || checkout.cep || ""),
    street: saved.street || "",
    number: saved.number || "",
    complement: saved.complement || "",
    district: saved.district || "",
    city: saved.city || "",
    state: saved.state || "",
  });
  const [error, setError] = useState("");
  const [lookup, setLookup] = useState({ status: "idle" }); // idle | loading | found | foundPartial | notFound | unavailable
  const [filled, setFilled] = useState([]); // campos que acabaram de ser preenchidos (para o destaque)

  const streetRef = useRef(null);
  const numberRef = useRef(null);
  // Só pula a busca se o endereço já foi salvo antes; um CEP vindo só do carrinho ainda preenche o endereço
  const lastLookup = useRef(digitsOf(saved.zip_code));

  const digits = digitsOf(form.zip_code);
  const { quote, error: quoteError } = useCartQuote(items, checkout.coupon, digits.length === 8 ? digits : "");

  useEffect(() => {
    if (digits.length !== 8) {
      setLookup((prev) => (prev.status === "idle" ? prev : { status: "idle" }));
      return undefined;
    }
    if (digits === lastLookup.current) return undefined;

    let cancelled = false;
    setLookup({ status: "loading" });
    setFilled([]);

    lookupCep(digits)
      .then((address) => {
        if (cancelled) return;
        lastLookup.current = digits;
        setForm((prev) => ({ ...prev, ...address })); // não mexe em número nem complemento
        setFilled(Object.keys(address).filter((key) => address[key]));
        setLookup({ status: address.street ? "found" : "foundPartial" });
        requestAnimationFrame(() => (address.street ? numberRef : streetRef).current?.focus());
      })
      .catch((err) => {
        if (cancelled) return;
        if (err.code === "not_found") lastLookup.current = digits; // não insiste no mesmo CEP inexistente
        setLookup({ status: err.code === "not_found" ? "notFound" : "unavailable" });
      });

    return () => {
      cancelled = true;
    };
  }, [digits]);

  if (items.length === 0) return <Navigate to="/cart" replace />;

  const fillClass = (key) => (filled.includes(key) ? "is-filled" : undefined);

  const onChange = (event) => {
    const { name, value } = event.target;
    const next = name === "zip_code" ? formatCep(value) : name === "state" ? value.toUpperCase().slice(0, 2) : value;
    setForm({ ...form, [name]: next });
  };

  function onSubmit(event) {
    event.preventDefault();
    const missing = ["street", "number", "district", "city"].some((k) => !form[k].trim());
    if (digits.length !== 8) return setError("Digite um CEP válido com 8 números.");
    if (missing) return setError("Preencha rua, número, bairro e cidade.");
    if (form.state.trim().length !== 2) return setError("Informe a UF com 2 letras (ex.: CE).");

    setError("");
    setCheckout({ cep: digits, address: { ...form, zip_code: digits } });
    navigate("/checkout/payment");
  }

  return (
    <CheckoutLayout step="delivery">
      <div className="checkout-grid">
        <div className="checkout-main">
          <form id="delivery-form" className="panel" onSubmit={onSubmit} noValidate>
            <h1>Endereço de entrega</h1>
            <div className="form-grid">
              <div className="field field--2">
                <label htmlFor="zip_code">CEP</label>
                <input id="zip_code" name="zip_code" inputMode="numeric" autoComplete="postal-code" value={form.zip_code} onChange={onChange} />
              </div>
              <div className="cep-status field--4" role="status" aria-live="polite" data-status={lookup.status}>
                {lookup.status === "loading" && <span className="spinner" aria-hidden="true" />}
                <span>{STATUS_TEXT[lookup.status]}</span>
              </div>

              <div className="field field--4">
                <label htmlFor="street">Rua</label>
                <input id="street" name="street" ref={streetRef} className={fillClass("street")} autoComplete="address-line1" value={form.street} onChange={onChange} />
              </div>
              <div className="field field--2">
                <label htmlFor="number">Número</label>
                <input id="number" name="number" ref={numberRef} value={form.number} onChange={onChange} />
              </div>

              <div className="field field--3">
                <label htmlFor="complement">Complemento (opcional)</label>
                <input id="complement" name="complement" autoComplete="address-line2" value={form.complement} onChange={onChange} />
              </div>
              <div className="field field--3">
                <label htmlFor="district">Bairro</label>
                <input id="district" name="district" className={fillClass("district")} value={form.district} onChange={onChange} />
              </div>

              <div className="field field--4">
                <label htmlFor="city">Cidade</label>
                <input id="city" name="city" className={fillClass("city")} autoComplete="address-level2" value={form.city} onChange={onChange} />
              </div>
              <div className="field field--2">
                <label htmlFor="state">UF</label>
                <input id="state" name="state" maxLength={2} className={fillClass("state")} autoComplete="address-level1" value={form.state} onChange={onChange} />
              </div>
            </div>

            {quote?.shipping && (
              <p className="notice notice--ok" style={{ marginTop: 16 }}>
                Entrega em até <b>{quote.shipping.days} dias úteis</b> —{" "}
                {quote.shipping.price === 0 ? "frete grátis" : formatPrice(quote.shipping.price)}
              </p>
            )}
            {(error || quoteError) && <p className="notice notice--error" role="alert" style={{ marginTop: 16 }}>{error || quoteError}</p>}
          </form>
        </div>

        <OrderSummary quote={quote}>
          <button type="submit" form="delivery-form" className="btn btn--primary">Continuar para o pagamento</button>
        </OrderSummary>
      </div>
    </CheckoutLayout>
  );
}

export default function DeliveryPage() {
  return (
    <RequireAuth>
      <DeliveryContent />
    </RequireAuth>
  );
}
