const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductImage = require('./ProductImage');
const ProductOption = require('./ProductOption');
const ProductCategory = require('./ProductCategory');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

const cascade = { onDelete: 'CASCADE', onUpdate: 'CASCADE' };

Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', ...cascade });
ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(ProductOption, { foreignKey: 'product_id', as: 'options', ...cascade });
ProductOption.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasMany(ProductCategory, { foreignKey: 'product_id', as: 'categoryLinks', ...cascade });
ProductCategory.belongsTo(Product, { foreignKey: 'product_id' });

Category.hasMany(ProductCategory, { foreignKey: 'category_id', as: 'productLinks', ...cascade });
ProductCategory.belongsTo(Category, { foreignKey: 'category_id' });

// Apagar um cliente apaga os pedidos dele; os itens acompanham o pedido
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders', ...cascade });
Order.belongsTo(User, { foreignKey: 'user_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', ...cascade });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

module.exports = { User, Category, Product, ProductImage, ProductOption, ProductCategory, Order, OrderItem };
