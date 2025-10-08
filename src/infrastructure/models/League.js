const { DataTypes, Model } = require('sequelize');
module.exports = (sequelize) => {
  class League extends Model { }
  League.init({
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true }
  }, {
    sequelize,
    modelName: 'League',
    tableName: 'leagues',
    underscored: true,
    timestamps: true
  });
  return League;
};