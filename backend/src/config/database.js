require('dotenv').config();
const { Sequelize } = require('sequelize');
const { buildDbConfig } = require('./dbConfig');

const db = buildDbConfig();

// timestamps: true + underscored: true => colunas created_at e updated_at
const sequelize = new Sequelize(db.database, db.username, db.password, {
  host: db.host,
  port: db.port,
  dialect: db.dialect, // "postgres" ou "mysql"
  logging: false,
  define: { underscored: true, timestamps: true },
});

module.exports = sequelize;
