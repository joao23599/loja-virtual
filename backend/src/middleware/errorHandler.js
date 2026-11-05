const { HttpError } = require('../utils/errors');

function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Rota não encontrada' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON inválido' });
  if (err.type === 'entity.too.large') return res.status(400).json({ message: 'Corpo da requisição muito grande' });
  if (err instanceof HttpError) return res.status(err.status).json({ message: err.message });
  if (err.name === 'SequelizeUniqueConstraintError' || err.name === 'SequelizeValidationError') {
    return res.status(400).json({ message: 'Dados da requisição incorretos' });
  }
  console.error(err);
  return res.status(500).json({ message: 'Erro interno do servidor' });
}

module.exports = { notFoundHandler, errorHandler };
