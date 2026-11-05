require('dotenv').config();
const { Sequelize } = require('sequelize');
const { buildDbConfig } = require('./dbConfig');

const db = buildDbConfig();

// Se a DATABASE_URL existir (no Render), usamos ela diretamente para o PostgreSQL.
// Caso contrário, usamos a configuração local (dbConfig).
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: false,
      define: { underscored: true, timestamps: true },
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false // Necessário para conexões externas no Render
        }
      }
    })
  : new Sequelize(db.database, db.username, db.password, {
      host: db.host,
      port: db.port,
      dialect: db.dialect, // "postgres" ou "mysql"
      logging: false,
      define: { underscored: true, timestamps: true },
    });

module.exports = sequelize;