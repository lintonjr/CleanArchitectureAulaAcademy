const LeagueRepository = require('../../domain/repositories/LeagueRepository');
const { models, sequelize } = require('../db/sequelize');


class SequelizeLeagueRepository extends LeagueRepository {
  async create({ name }) {
    const row = await models.League.create({ name });
    return row.get({ plain: true });
  }
  async update(id, { name }) {
    await models.League.update({ name }, { where: { id } });
    return this.findById(id);
  }
  async delete(id) {
    await models.League.destroy({ where: { id } });
    return true;
  }
  async list() {
    return models.League.findAll({ order: [['id', 'ASC']], raw: true });
  }
  async findById(id) {
    return models.League.findByPk(id, { raw: true });
  }
}
module.exports = SequelizeLeagueRepository;