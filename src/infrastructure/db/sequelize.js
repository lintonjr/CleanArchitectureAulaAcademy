const { Sequelize } = require('sequelize');
require('dotenv').config();


const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  { host: process.env.DB_HOST, port: process.env.DB_PORT, dialect: 'mysql', logging: false }
);


// Models
const League = require('../models/League')(sequelize);
const Player = require('../models/Player')(sequelize);
const Tournament = require('../models/Tournament')(sequelize);
const TournamentPlayer = require('../models/TournamentPlayer')(sequelize);


// Associations
Tournament.belongsTo(League, { foreignKey: 'league_id', as: 'league' });
League.hasMany(Tournament, { foreignKey: 'league_id', as: 'tournaments' });


Player.belongsToMany(Tournament, { through: TournamentPlayer, foreignKey: 'player_id', otherKey: 'tournament_id', as: 'tournaments' });
Tournament.belongsToMany(Player, { through: TournamentPlayer, foreignKey: 'tournament_id', otherKey: 'player_id', as: 'players' });


module.exports = { sequelize, models: { League, Player, Tournament, TournamentPlayer } };