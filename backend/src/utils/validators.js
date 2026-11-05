const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isEmail = (v) => isNonEmptyString(v) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);

// "12" -> 12 ; "abc", "-1", "1.5" -> null
const parseId = (value) => (/^\d+$/.test(String(value)) ? Number(value) : null);

// 4, "4", "4px" -> 4 ; undefined/null/"" -> 0 ; inválido -> null
function parseRadius(value) {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return Number.isInteger(value) && value >= 0 ? value : null;
  const m = String(value).trim().match(/^(\d+)(px)?$/i);
  return m ? Number(m[1]) : null;
}

// ["PP","GG"] ou "PP,GG" -> ["PP","GG"] ; vazio/inválido -> null
function parseOptionValues(value) {
  let list;
  if (Array.isArray(value)) list = value.map((v) => String(v).trim());
  else if (typeof value === 'string') list = value.split(',').map((v) => v.trim());
  else return null;
  list = list.filter(Boolean);
  if (!list.length || list.some((v) => v.includes(','))) return null;
  return list;
}

module.exports = { isNonEmptyString, isEmail, isNumber, parseId, parseRadius, parseOptionValues };
