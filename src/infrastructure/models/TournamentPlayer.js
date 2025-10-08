const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class TournamentPlayer extends Model { }
  TournamentPlayer.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tournament_id: { type: DataTypes.INTEGER, allowNull: false },
    player_id: { type: DataTypes.INTEGER, allowNull: false },
    points: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  }, {
    sequelize,
    modelName: 'TournamentPlayer',
    tableName: 'tournament_players',
    underscored: true,
    timestamps: true
  });
  return TournamentPlayer;
};