module.exports = ({ tournamentRepository, leagueRepository }) => async ({ leagueId, name, date, numRounds }) => {
  if (!leagueId || !name || !date || !numRounds) throw new Error('leagueId, name, date, numRounds are required');
  const league = await leagueRepository.findById(leagueId);
  if (!league) throw new Error('League not found');
  return tournamentRepository.create({ leagueId, name, date, numRounds });
};