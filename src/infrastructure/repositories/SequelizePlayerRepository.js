const PlayerRepository = require('../../domain/repositories/PlayerRepository');
const { models } = require('../db/sequelize');


class SequelizePlayerRepository extends PlayerRepository {
  async create({ name, email }) {
    const row = await models.Player.create({ name, email });
    return row.get({ plain: true });
  }
  async update(id, data) {
    await models.Player.update({ name: data.name, email: data.email }, { where: { id } });
    return this.findById(id);
  }
  async delete(id) { await models.Player.destroy({ where: { id } }); return true; }
  async list() { return models.Player.findAll({ order: [['id', 'ASC']], raw: true }); }
  async findById(id) { return models.Player.findByPk(id, { raw: true }); }
}
module.exports = SequelizePlayerRepository;