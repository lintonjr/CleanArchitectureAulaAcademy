const TournamentRepository = require('../../domain/repositories/TournamentRepository');
const { models } = require('../db/sequelize');


class SequelizeTournamentRepository extends TournamentRepository {
  async create({ leagueId, name, date, numRounds }) {
    const row = await models.Tournament.create({ league_id: leagueId, name, date, num_rounds: numRounds });
    const { id } = row.get({ plain: true });
    return { id, leagueId, name, date, numRounds };
  }
  async update(id, data) {
    const payload = {};
    if (data.leagueId !== undefined) payload.league_id = data.leagueId;
    if (data.name !== undefined) payload.name = data.name;
    if (data.date !== undefined) payload.date = data.date;
    if (data.numRounds !== undefined) payload.num_rounds = data.numRounds;
    await models.Tournament.update(payload, { where: { id } });
    return this.findById(id);
  }
  async delete(id) {
    await models.Tournament.destroy({ where: { id } });
    return true;
  }
  async list() {
    const rows = await models.Tournament.findAll({ order: [['date', 'DESC'], ['id', 'DESC']], raw: true });
    return rows;
  }
  async findById(id) {
    const row = await models.Tournament.findByPk(id, { raw: true });
    if (!row) return null;
    return { id: row.id, leagueId: row.league_id, name: row.name, date: row.date, numRounds: row.num_rounds };
  }
  async addPlayer(tournamentId, playerId, points = 0) {
    const [tp, created] = await models.TournamentPlayer.findOrCreate({
      where: { tournament_id: tournamentId, player_id: playerId },
      defaults: { points }
    });
    if (!created) {
      await tp.update({ points });
    }
    return tp.get({ plain: true });
  }
}
module.exports = SequelizeTournamentRepository;