const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/categoryController');

// "/search" precisa vir antes de "/:id"
router.get('/search', ctrl.search);
router.get('/:id', ctrl.getById);
router.post('/', auth, ctrl.create);
router.put('/:id', auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
