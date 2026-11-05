const service = require('../services/orderService');
const { asyncHandler } = require('../utils/errors');

exports.quote = asyncHandler(async (req, res) => res.status(200).json(await service.quote(req.body)));
