const { sequelize, models } = require('../src/infrastructure/db/sequelize');
module.exports = { sequelize, Sequelize: require('sequelize'), ...models };