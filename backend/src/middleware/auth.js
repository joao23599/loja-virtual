const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const { unauthorized } = require('../utils/errors');

// Exige "Authorization: Bearer <jwt>" nas rotas POST/PUT/DELETE protegidas.
// Token ausente ou inválido => 401 (como definido em cada endpoint do documento).
module.exports = function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(unauthorized('Token de autorização não informado'));
  }
  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return next(unauthorized('Token inválido ou expirado'));
  }
};
