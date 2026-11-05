import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CART_KEY = "cart";
const CHECKOUT_KEY = "checkout";

const read = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* armazenamento indisponível: o carrinho só não persiste */
  }
};

// Mesmo produto com opções diferentes (tamanho 40 x 41) vira linhas diferentes
const keyOf = (productId, options) => `${productId}:${JSON.stringify(Object.entries(options || {}).sort())}`;

const CartContext = createContext(null);

/**
 * items:    [{ key, productId, name, image, options: {Tamanho: "40"}, quantity }]  (preço vem da API, nunca daqui)
 * checkout: { coupon, cep, address }  (dados que atravessam Carrinho → Entrega → Pagamento)
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const stored = read(CART_KEY, []);
    return Array.isArray(stored) ? stored : [];
  });
  const [checkout, setCheckoutState] = useState(() => {
    const stored = read(CHECKOUT_KEY, {});
    return stored && typeof stored === "object" ? stored : {};
  });

  useEffect(() => write(CART_KEY, items), [items]);
  useEffect(() => write(CHECKOUT_KEY, checkout), [checkout]);

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const key = keyOf(item.productId, item.options);
      const quantity = item.quantity || 1;
      if (prev.some((i) => i.key === key)) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(i.quantity + quantity, 99) } : i));
      }
      return [...prev, { ...item, key, quantity }];
    });
  }, []);

  const setQuantity = useCallback((key, quantity) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.key !== key)
        : prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(quantity, 99) } : i))
    );
  }, []);

  const removeItem = useCallback((key) => setItems((prev) => prev.filter((i) => i.key !== key)), []);

  const replaceItems = useCallback(
    (list) => setItems(list.map((i) => ({ ...i, key: keyOf(i.productId, i.options) }))),
    []
  );

  const setCheckout = useCallback((patch) => setCheckoutState((prev) => ({ ...prev, ...patch })), []);

  // depois de finalizar o pedido
  const finishOrder = useCallback(() => {
    setItems([]);
    setCheckoutState({});
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      addItem,
      setQuantity,
      removeItem,
      replaceItems,
      checkout,
      setCheckout,
      finishOrder,
    }),
    [items, checkout, addItem, setQuantity, removeItem, replaceItems, setCheckout, finishOrder]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return context;
}
