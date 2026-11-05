import { useEffect, useState } from "react";
import { quoteCart } from "../services/cartService";

// Recalcula o carrinho na API sempre que itens, cupom ou CEP mudam.
export function useCartQuote(items, coupon, cep) {
  const [state, setState] = useState({ quote: null, error: "", loading: false });
  const signature = JSON.stringify([items.map((i) => [i.productId, i.quantity, i.options]), coupon || "", cep || ""]);

  useEffect(() => {
    if (!items.length) {
      setState({ quote: null, error: "", loading: false });
      return undefined;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    quoteCart({ items, coupon, cep })
      .then((quote) => !cancelled && setState({ quote, error: "", loading: false }))
      .catch((err) => !cancelled && setState({ quote: null, error: err.message, loading: false }));

    return () => {
      cancelled = true;
    };
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
