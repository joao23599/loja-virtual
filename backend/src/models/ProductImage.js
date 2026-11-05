const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define(
  'ProductImage',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    enabled: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    path: { type: DataTypes.STRING, allowNull: false }, // caminho relativo dentro de MEDIA_DIR
  },
  { tableName: 'product_images', timestamps: false }
);
