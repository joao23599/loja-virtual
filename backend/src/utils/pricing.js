// Todo cálculo é feito em CENTAVOS (inteiros) para evitar erros de arredondamento de ponto flutuante.
const PIX_RATE = 0.05; // 5% de desconto no Pix

const toCents = (value) => Math.round(Number(value) * 100);
const toReais = (cents) => cents / 100;

// price_with_discount = 0 (ou maior que o preço) significa "sem desconto"
const finalUnitCents = (priceCents, discountCents) =>
  discountCents > 0 && discountCents < priceCents ? discountCents : priceCents;

const pixUnitCents = (finalCents) => Math.round(finalCents * (1 - PIX_RATE));

/**
 * @param lines    [{ priceCents, discountCents, quantity }]
 * @param coupon   { discountCents, freeShipping } | null   (veja coupons.applyCoupon)
 * @param shipping { priceCents } | null
 */
function computeTotals({ lines, coupon = null, shipping = null }) {
  let subtotal = 0;
  let productDiscount = 0;
  for (const line of lines) {
    subtotal += line.priceCents * line.quantity;
    productDiscount += (line.priceCents - finalUnitCents(line.priceCents, line.discountCents)) * line.quantity;
  }

  const base = subtotal - productDiscount;
  const couponDiscount = coupon ? Math.min(coupon.discountCents, base) : 0;
  const freeShipping = Boolean(coupon && coupon.freeShipping);
  const shippingCents = shipping && !freeShipping ? shipping.priceCents : 0;

  const payable = base - couponDiscount;
  const pixDiscount = Math.round(payable * PIX_RATE); // o Pix não desconta o frete
  const totalCard = payable + shippingCents;

  return {
    subtotal,
    productDiscount,
    base,
    couponDiscount,
    shippingCents,
    pixDiscount,
    totalCard,
    totalPix: totalCard - pixDiscount,
  };
}

module.exports = { PIX_RATE, toCents, toReais, finalUnitCents, pixUnitCents, computeTotals };
