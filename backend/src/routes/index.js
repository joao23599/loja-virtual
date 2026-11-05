const router = require('express').Router();

router.use('/user', require('./userRoutes'));
router.use('/category', require('./categoryRoutes'));
router.use('/product', require('./productRoutes'));
router.use('/cart', require('./cartRoutes'));
router.use('/order', require('./orderRoutes'));

module.exports = router;
