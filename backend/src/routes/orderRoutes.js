const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/orderController');

router.post('/', auth, ctrl.create);
router.get('/:id', auth, ctrl.getById); // só o dono do pedido enxerga

module.exports = router;
