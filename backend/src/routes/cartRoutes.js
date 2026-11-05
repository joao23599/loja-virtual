const router = require('express').Router();
const ctrl = require('../controllers/cartController');

// Pública: o carrinho funciona sem login (só calcula, não grava nada)
router.post('/quote', ctrl.quote);

module.exports = router;
