const crypto = require('crypto');
const sequelize = require('../config/database');
const { Product, ProductImage, ProductOption, Order, OrderItem } = require('../models');
const { badRequest, notFound } = require('../utils/errors');
const V = require('../utils/validators');
const { toCents, toReais, finalUnitCents, pixUnitCents, computeTotals } = require('../utils/pricing');
const { applyCoupon } = require('../utils/coupons');
const { quoteShipping, normalizeCep } = require('../utils/shipping');
const { imageUrl } = require('../utils/imageStorage');

const METHODS = ['pix', 'card', 'boleto'];

// ---------- validação ----------
function parseItems(list) {
  if (!Array.isArray(list) || list.length < 1 || list.length > 50) throw badRequest('items deve ter de 1 a 50 itens');
  return list.map((raw) => {
    if (!raw || typeof raw !== 'object') throw badRequest('item inválido');
    const { product_id: productId, quantity, options } = raw;
    if (!Number.isInteger(productId) || productId < 1) throw badRequest('product_id inválido');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw badRequest('quantity deve ser de 1 a 99');

    const chosen = {};
    if (options !== undefined) {
      if (!options || typeof options !== 'object' || Array.isArray(options)) throw badRequest('options inválido');
      for (const [title, value] of Object.entries(options)) {
        if (typeof value !== 'string') throw badRequest('options inválido');
        chosen[title] = value;
      }
    }
    return { product_id: productId, quantity, options: chosen };
  });
}

// Todo produto com opções (tamanho, cor...) precisa ter uma opção válida escolhida
function validateOptions(product, chosen) {
  const result = {};
  for (const option of product.options) {
    const allowed = option.optionValues.split(',');
    const value = Object.prototype.hasOwnProperty.call(chosen, option.title) ? chosen[option.title] : undefined;
    if (value === undefined || !allowed.includes(value)) {
      throw badRequest(`Selecione ${option.title} para "${product.name}"`);
    }
    result[option.title] = value;
  }
  return result;
}

function parseAddress(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw badRequest('address é obrigatório');
  const zip = normalizeCep(raw.zip_code);
  if (!/^\d{8}$/.test(zip)) throw badRequest('CEP inválido');

  const required = (key, label) => {
    if (!V.isNonEmptyString(raw[key]) || raw[key].trim().length > 120) throw badRequest(`${label} inválido`);
    return raw[key].trim();
  };
  if (!V.isNonEmptyString(raw.state) || !/^[A-Za-z]{2}$/.test(raw.state.trim())) throw badRequest('UF inválida');
  if (raw.complement !== undefined && raw.complement !== null && typeof raw.complement !== 'string') {
    throw badRequest('complemento inválido');
  }

  return {
    zip_code: zip,
    street: required('street', 'Rua'),
    number: required('number', 'Número'),
    complement: raw.complement ? raw.complement.trim().slice(0, 120) : null,
    district: required('district', 'Bairro'),
    city: required('city', 'Cidade'),
    state: raw.state.trim().toUpperCase(),
  };
}

// ---------- cálculo (o servidor é a fonte da verdade: nunca confiamos em preço vindo do front) ----------
async function buildQuote(body, { transaction } = {}) {
  if (!body || typeof body !== 'object') throw badRequest('Corpo inválido');
  const items = parseItems(body.items);

  const ids = [...new Set(items.map((i) => i.product_id))];
  const products = await Product.findAll({
    where: { id: ids },
    include: [
      { model: ProductImage, as: 'images', separate: true, order: [['id', 'ASC']] },
      { model: ProductOption, as: 'options', separate: true, order: [['id', 'ASC']] },
    ],
    transaction,
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const wanted = new Map(); // quantidade total pedida por produto (mesmo produto pode aparecer com opções diferentes)
  const lines = items.map((item) => {
    const product = byId.get(item.product_id);
    if (!product) throw badRequest(`Produto ${item.product_id} não existe`);
    wanted.set(product.id, (wanted.get(product.id) || 0) + item.quantity);
    return {
      product,
      quantity: item.quantity,
      options: validateOptions(product, item.options),
      priceCents: toCents(product.price),
      discountCents: toCents(product.price_with_discount),
    };
  });

  for (const [id, quantity] of wanted) {
    const product = byId.get(id);
    if ((product.stock || 0) < quantity) {
      throw badRequest(`Estoque insuficiente para "${product.name}" (disponível: ${product.stock || 0})`);
    }
  }

  const preview = computeTotals({ lines });
  const coupon = body.coupon ? applyCoupon(body.coupon, preview.base) : null;
  const shipping = body.cep ? quoteShipping(body.cep, preview.base) : null;
  const totals = computeTotals({ lines, coupon, shipping });

  return { lines, coupon, shipping, totals, wanted };
}

function serializeQuote({ lines, coupon, shipping, totals }) {
  return {
    items: lines.map((l) => {
      const finalCents = finalUnitCents(l.priceCents, l.discountCents);
      return {
        product_id: l.product.id,
        name: l.product.name,
        image: l.product.images[0] ? imageUrl(l.product.images[0].path) : null,
        options: l.options,
        quantity: l.quantity,
        unit_price: toReais(l.priceCents),
        unit_price_final: toReais(finalCents),
        unit_price_pix: toReais(pixUnitCents(finalCents)),
      };
    }),
    subtotal: toReais(totals.subtotal),
    product_discount: toReais(totals.productDiscount),
    coupon: coupon ? { code: coupon.code, discount: toReais(totals.couponDiscount), free_shipping: coupon.freeShipping } : null,
    shipping: shipping
      ? { cep: shipping.cep, price: toReais(totals.shippingCents), days: shipping.days, free: totals.shippingCents === 0 }
      : null,
    pix_discount: toReais(totals.pixDiscount),
    total: toReais(totals.totalCard), // cartão / boleto
    total_pix: toReais(totals.totalPix),
  };
}

async function quote(body) {
  return serializeQuote(await buildQuote(body));
}

// ---------- pedidos ----------
// Pagamento SIMULADO: nenhum dado de cartão é recebido e nenhum Pix/boleto real é emitido.
function generatePaymentCode(method) {
  if (method === 'pix') return `PIX-SIMULADO-${crypto.randomUUID()}`;
  if (method === 'boleto') {
    const d = Array.from({ length: 47 }, () => crypto.randomInt(0, 10)).join('');
    return `${d.slice(0, 5)}.${d.slice(5, 10)} ${d.slice(10, 15)}.${d.slice(15, 21)} ${d.slice(21, 26)}.${d.slice(26, 32)} ${d[32]} ${d.slice(33)}`;
  }
  return null;
}

function serializeOrder(order) {
  const items = [...(order.items || [])].sort((a, b) => a.id - b.id);
  return {
    id: order.id,
    status: order.status,
    payment_method: order.payment_method,
    payment_code: order.payment_code,
    created_at: order.createdAt,
    items: items.map((i) => ({
      product_id: i.product_id,
      name: i.name,
      image: i.image_path ? imageUrl(i.image_path) : null,
      options_text: i.options_text,
      quantity: i.quantity,
      unit_price: toReais(i.unit_price_cents),
      unit_price_final: toReais(i.unit_final_cents),
    })),
    subtotal: toReais(order.subtotal_cents),
    product_discount: toReais(order.product_discount_cents),
    coupon: order.coupon_code ? { code: order.coupon_code, discount: toReais(order.coupon_discount_cents) } : null,
    shipping: { price: toReais(order.shipping_cents), days: order.shipping_days },
    pix_discount: toReais(order.pix_discount_cents),
    total: toReais(order.total_cents),
    address: {
      zip_code: order.zip_code,
      street: order.street,
      number: order.number,
      complement: order.complement,
      district: order.district,
      city: order.city,
      state: order.state,
    },
  };
}

async function getById(userId, rawId) {
  const id = V.parseId(rawId);
  if (id === null) throw notFound('Pedido não encontrado');
  const order = await Order.findByPk(id, { include: [{ model: OrderItem, as: 'items' }] });
  if (!order || order.user_id !== userId) throw notFound('Pedido não encontrado'); // pedido de outra pessoa = 404
  return serializeOrder(order);
}

async function create(userId, body) {
  if (!body || typeof body !== 'object') throw badRequest('Corpo inválido');
  if (!METHODS.includes(body.payment_method)) throw badRequest('payment_method deve ser pix, card ou boleto');
  const method = body.payment_method;
  const address = parseAddress(body.address);
  const ids = [...new Set(parseItems(body.items).map((i) => i.product_id))];

  const orderId = await sequelize.transaction(async (transaction) => {
    // trava os produtos para duas compras simultâneas não levarem o mesmo estoque
    await Product.findAll({ where: { id: ids }, attributes: ['id'], transaction, lock: transaction.LOCK.UPDATE });

    const q = await buildQuote({ ...body, cep: address.zip_code }, { transaction });
    const isPix = method === 'pix';

    const order = await Order.create(
      {
        user_id: userId,
        status: method === 'card' ? 'paid' : 'awaiting_payment',
        payment_method: method,
        payment_code: generatePaymentCode(method),
        coupon_code: q.coupon ? q.coupon.code : null,
        subtotal_cents: q.totals.subtotal,
        product_discount_cents: q.totals.productDiscount,
        coupon_discount_cents: q.totals.couponDiscount,
        shipping_cents: q.totals.shippingCents,
        shipping_days: q.shipping.days,
        pix_discount_cents: isPix ? q.totals.pixDiscount : 0,
        total_cents: isPix ? q.totals.totalPix : q.totals.totalCard,
        ...address,
      },
      { transaction }
    );

    for (const line of q.lines) {
      await OrderItem.create(
        {
          order_id: order.id,
          product_id: line.product.id,
          name: line.product.name,
          image_path: line.product.images[0] ? line.product.images[0].path : null,
          options_text: Object.entries(line.options).map(([k, v]) => `${k}: ${v}`).join(' · ') || null,
          quantity: line.quantity,
          unit_price_cents: line.priceCents,
          unit_final_cents: finalUnitCents(line.priceCents, line.discountCents),
        },
        { transaction }
      );
    }
    for (const [id, quantity] of q.wanted) {
      await Product.decrement('stock', { by: quantity, where: { id }, transaction });
    }
    return order.id;
  });

  return getById(userId, orderId);
}

module.exports = { quote, create, getById };
