const service = require('../services/productService');
const { asyncHandler } = require('../utils/errors');

exports.search = asyncHandler(async (req, res) => res.status(200).json(await service.search(req.query)));
exports.getById = asyncHandler(async (req, res) => res.status(200).json(await service.getById(req.params.id)));
exports.create = asyncHandler(async (req, res) => res.status(201).json(await service.create(req.body)));
exports.update = asyncHandler(async (req, res) => {
  await service.update(req.params.id, req.body);
  res.status(204).send();
});
exports.remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.status(204).send();
});
exports.filters = asyncHandler(async (req, res) => res.status(200).json(await service.getFilters()));
