const { computeTotals, toCents, finalUnitCents, pixUnitCents } = require('../src/utils/pricing');
const { applyCoupon } = require('../src/utils/coupons');
const { quoteShipping } = require('../src/utils/shipping');

// Mesmo exemplo da tela do carrinho: R$ 59,99 por R$ 34,99
const line = { priceCents: toCents(59.99), discountCents: toCents(34.99), quantity: 1 };

describe('cálculo do carrinho', () => {
  test('descontos e total no Pix batem com o exemplo (R$ 25,00 e R$ 1,75)', () => {
    const t = computeTotals({ lines: [line] });
    expect(t.subtotal).toBe(5999);
    expect(t.productDiscount).toBe(2500);
    expect(t.pixDiscount).toBe(175);
    expect(t.totalCard).toBe(3499);
    expect(t.totalPix).toBe(3324);
  });

  test('desconto 0 significa sem desconto', () => {
    expect(finalUnitCents(5000, 0)).toBe(5000);
    expect(finalUnitCents(5000, 6000)).toBe(5000);
  });

  test('quantidade multiplica', () => {
    const t = computeTotals({ lines: [{ ...line, quantity: 3 }] });
    expect(t.subtotal).toBe(17997);
    expect(t.totalCard).toBe(10497);
  });

  test('preço unitário no Pix', () => {
    expect(pixUnitCents(3499)).toBe(3324);
  });

  test('frete entra no total do cartão, mas não recebe desconto do Pix', () => {
    const shipping = quoteShipping('60000-000', 3499);
    const t = computeTotals({ lines: [line], shipping });
    expect(t.shippingCents).toBe(2990);
    expect(t.totalCard).toBe(3499 + 2990);
    expect(t.totalPix).toBe(3499 + 2990 - 175);
  });
});

describe('cupons', () => {
  test('percentual', () => {
    expect(applyCoupon('bemvindo10', 10000)).toMatchObject({ code: 'BEMVINDO10', discountCents: 1000 });
  });
  test('valor mínimo', () => {
    expect(() => applyCoupon('DESCONTO20', 5000)).toThrow(/a partir de/);
  });
  test('frete grátis zera o frete', () => {
    const coupon = applyCoupon('FRETEGRATIS', 3499);
    const t = computeTotals({ lines: [line], coupon, shipping: quoteShipping('60000000', 3499) });
    expect(t.shippingCents).toBe(0);
  });
  test('cupom inexistente lança erro', () => {
    expect(() => applyCoupon('NAOEXISTE', 10000)).toThrow(/inválido/);
  });
});

describe('frete', () => {
  test('CEP inválido', () => {
    expect(() => quoteShipping('123', 1000)).toThrow(/CEP inválido/);
  });
  test('grátis a partir de R$ 200', () => {
    expect(quoteShipping('60000000', 20000).priceCents).toBe(0);
    expect(quoteShipping('60000000', 19999).priceCents).toBe(2990);
  });
});
