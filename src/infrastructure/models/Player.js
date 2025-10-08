const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Player extends Model { }
  Player.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true }
  }, {
    sequelize,
    modelName: 'Player',
    tableName: 'players',
    underscored: true,
    timestamps: true
  });
  return Player;
};