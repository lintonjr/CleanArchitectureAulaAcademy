const { models } = require('../../infrastructure/db/sequelize');
const { fn, col } = require('sequelize');


module.exports = () => async ({ leagueId }) => {
  if (!leagueId) throw new Error('leagueId is required');
  const rows = await models.TournamentPlayer.findAll({
    include: [
      { model: models.Tournament, as: 'Tournament', attributes: [], where: { league_id: leagueId } },
      { model: models.Player, as: 'Player', attributes: ['id', 'name', 'email'] }
    ],
    attributes: [[fn('SUM', col('TournamentPlayer.points')), 'total_points'], 'Player.id', 'Player.name', 'Player.email'],
    group: ['Player.id'],
    order: [[fn('SUM', col('TournamentPlayer.points')), 'DESC']],
    raw: true
  });
  return rows.map(r => ({ id: r['Player.id'], name: r['Player.name'], email: r['Player.email'], total_points: Number(r.total_points) }));
};