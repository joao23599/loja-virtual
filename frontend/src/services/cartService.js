import { request } from "./api";

const toPayloadItems = (items) =>
  items.map((i) => ({ product_id: i.productId, quantity: i.quantity, options: i.options || {} }));

// POST /v1/cart/quote (público): o servidor recalcula preços, descontos, cupom e frete
export const quoteCart = ({ items, coupon, cep }) =>
  request("/cart/quote", {
    method: "POST",
    body: { items: toPayloadItems(items), coupon: coupon || undefined, cep: cep || undefined },
  });

// POST /v1/order (precisa de login)
export const createOrder = ({ items, coupon, paymentMethod, address }) =>
  request("/order", {
    method: "POST",
    body: {
      items: toPayloadItems(items),
      coupon: coupon || undefined,
      payment_method: paymentMethod,
      address,
    },
  });

// GET /v1/order/:id (só o dono)
export const getOrder = (id) => request(`/order/${id}`);
