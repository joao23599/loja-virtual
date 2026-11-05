const service = require('../services/orderService');
const { asyncHandler } = require('../utils/errors');

exports.create = asyncHandler(async (req, res) => res.status(201).json(await service.create(req.user.id, req.body)));
exports.getById = asyncHandler(async (req, res) => res.status(200).json(await service.getById(req.user.id, req.params.id)));
