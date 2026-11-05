const { badRequest } = require('./errors');

// Frete SIMULADO: valor e prazo dependem do primeiro dígito do CEP. Grátis a partir de R$ 200.
const BY_FIRST_DIGIT = {
  0: [1490, 2], 1: [1490, 3], 2: [1990, 4], 3: [1990, 5], 4: [2490, 6],
  5: [2490, 6], 6: [2990, 7], 7: [2990, 7], 8: [2290, 5], 9: [2290, 5],
};
const FREE_FROM_CENTS = 20000;

const normalizeCep = (cep) => String(cep ?? '').replace(/\D/g, '');

function quoteShipping(cep, baseCents) {
  const digits = normalizeCep(cep);
  if (!/^\d{8}$/.test(digits)) throw badRequest('CEP inválido');
  const [price, days] = BY_FIRST_DIGIT[digits[0]];
  return { cep: digits, priceCents: baseCents >= FREE_FROM_CENTS ? 0 : price, days };
}

module.exports = { normalizeCep, quoteShipping, FREE_FROM_CENTS };
