const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// "Foto" do produto no momento da compra: nome e preço não mudam se o produto for editado ou apagado depois.
module.exports = sequelize.define(
  'OrderItem',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING, allowNull: false },
    image_path: { type: DataTypes.STRING, allowNull: true },
    options_text: { type: DataTypes.STRING(1000), allowNull: true }, // ex.: "Tamanho: 40 · Cor: #FF6969"
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    unit_price_cents: { type: DataTypes.INTEGER, allowNull: false },
    unit_final_cents: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: 'order_items', timestamps: false }
);
