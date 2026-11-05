const { badRequest } = require('./errors');

// limit: padrão 12; -1 = todos (page é ignorado). page: padrão 1.
function parsePagination(query, defaultLimit = 12) {
  let limit = defaultLimit;
  let page = 1;

  if (query.limit !== undefined) {
    if (!/^-?\d+$/.test(query.limit)) throw badRequest('limit inválido');
    limit = Number(query.limit);
    if (limit !== -1 && limit < 1) throw badRequest('limit inválido');
  }
  if (query.page !== undefined) {
    if (!/^\d+$/.test(query.page) || Number(query.page) < 1) throw badRequest('page inválido');
    page = Number(query.page);
  }
  if (limit === -1) page = 1;

  return {
    limit,
    page,
    sqlLimit: limit === -1 ? undefined : limit,
    offset: limit === -1 ? undefined : (page - 1) * limit,
  };
}

function parseFields(raw, allowed) {
  if (raw === undefined) return null;
  if (typeof raw !== 'string') throw badRequest('fields inválido');
  const fields = raw.split(',').map((f) => f.trim()).filter(Boolean);
  if (!fields.length || fields.some((f) => !allowed.includes(f))) {
    throw badRequest(`fields inválido. Permitidos: ${allowed.join(', ')}`);
  }
  return fields;
}

const pick = (obj, fields) =>
  fields ? Object.fromEntries(fields.map((f) => [f, obj[f]])) : obj;

module.exports = { parsePagination, parseFields, pick };
