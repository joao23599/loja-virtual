class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const badRequest = (message = 'Dados da requisição incorretos') => new HttpError(400, message);
const unauthorized = (message = 'Não autorizado') => new HttpError(401, message);
const notFound = (message = 'Recurso não encontrado') => new HttpError(404, message);

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { HttpError, badRequest, unauthorized, notFound, asyncHandler };
