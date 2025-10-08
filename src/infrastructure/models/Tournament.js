const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class Tournament extends Model { }
  Tournament.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    league_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    num_rounds: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    sequelize,
    modelName: 'Tournament',
    tableName: 'tournaments',
    underscored: true,
    timestamps: true
  });
  return Tournament;
};