require('dotenv').config();
const { Sequelize } = require('sequelize');

// Usando DB_URI para la conexión
const sequelize = new Sequelize(process.env.DB_URI, {
  dialect: 'postgres',
  logging: console.log,
});

module.exports = sequelize;

