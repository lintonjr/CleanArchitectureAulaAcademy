module.exports = ({ tournamentRepository, leagueRepository }) => async ({ id, leagueId, name, date, numRounds }) => {
  if (!id) throw new Error('id is required');
  if (leagueId) {
    const league = await leagueRepository.findById(leagueId);
    if (!league) throw new Error('League not found');
  }
  return tournamentRepository.update(id, { leagueId, name, date, numRounds });
};