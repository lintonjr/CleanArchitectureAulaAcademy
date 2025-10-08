'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tournaments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      league_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'leagues', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'
      },
      name: { type: Sequelize.STRING, allowNull: false },
      date: { type: Sequelize.DATEONLY, allowNull: false },
      num_rounds: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
    });
    await queryInterface.addIndex('tournaments', ['league_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('tournaments'); }
};