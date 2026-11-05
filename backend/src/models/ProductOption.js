const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = sequelize.define(
  'ProductOption',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    shape: { type: DataTypes.ENUM('square', 'circle'), allowNull: true, defaultValue: 'square' },
    radius: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    type: { type: DataTypes.ENUM('text', 'color'), allowNull: true, defaultValue: 'text' },
    // coluna "values" (valores separados por vírgula). O atributo JS tem outro nome
    // para não colidir com membros internos do Sequelize.
    optionValues: { type: DataTypes.STRING(1000), allowNull: false, field: 'values' },
  },
  { tableName: 'product_options', timestamps: false }
);
