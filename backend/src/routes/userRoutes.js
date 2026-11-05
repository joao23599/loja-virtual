const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/userController');

// Públicas: cadastro e geração de token (senão ninguém conseguiria o primeiro token)
router.post('/token', ctrl.token);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
