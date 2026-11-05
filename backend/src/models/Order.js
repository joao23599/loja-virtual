const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Valores em CENTAVOS (INTEGER). Endereço é copiado para o pedido (histórico não muda se o cliente mudar depois).
module.exports = sequelize.define(
  'Order',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('awaiting_payment', 'paid'), allowNull: false, defaultValue: 'awaiting_payment' },
    payment_method: { type: DataTypes.ENUM('pix', 'card', 'boleto'), allowNull: false },
    payment_code: { type: DataTypes.STRING, allowNull: true }, // código Pix / linha do boleto (simulados)
    coupon_code: { type: DataTypes.STRING, allowNull: true },
    subtotal_cents: { type: DataTypes.INTEGER, allowNull: false },
    product_discount_cents: { type: DataTypes.INTEGER, allowNull: false },
    coupon_discount_cents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    shipping_cents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    shipping_days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    pix_discount_cents: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    total_cents: { type: DataTypes.INTEGER, allowNull: false },
    zip_code: { type: DataTypes.STRING, allowNull: false },
    street: { type: DataTypes.STRING, allowNull: false },
    number: { type: DataTypes.STRING, allowNull: false },
    complement: { type: DataTypes.STRING, allowNull: true },
    district: { type: DataTypes.STRING, allowNull: false },
    city: { type: DataTypes.STRING, allowNull: false },
    state: { type: DataTypes.STRING(2), allowNull: false },
  },
  { tableName: 'orders', timestamps: true }
);
