const { badRequest } = require('./errors');

// Cupons de exemplo (em um projeto real ficariam em uma tabela)
const COUPONS = {
  BEMVINDO10: { type: 'percent', value: 10 },
  DESCONTO20: { type: 'fixed', value: 2000, minBaseCents: 10000 }, // R$ 20 em compras a partir de R$ 100
  FRETEGRATIS: { type: 'free_shipping' },
};

// baseCents = subtotal já com os descontos dos produtos
function applyCoupon(rawCode, baseCents) {
  const code = String(rawCode || '').trim().toUpperCase();
  const coupon = COUPONS[code];
  if (!coupon) throw badRequest('Cupom inválido');
  if (coupon.minBaseCents && baseCents < coupon.minBaseCents) {
    throw badRequest(`Cupom válido para compras a partir de R$ ${coupon.minBaseCents / 100}`);
  }
  if (coupon.type === 'percent') return { code, discountCents: Math.round((baseCents * coupon.value) / 100), freeShipping: false };
  if (coupon.type === 'fixed') return { code, discountCents: coupon.value, freeShipping: false };
  return { code, discountCents: 0, freeShipping: true };
}

module.exports = { COUPONS, applyCoupon };
