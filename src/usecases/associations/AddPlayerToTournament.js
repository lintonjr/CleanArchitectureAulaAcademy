module.exports = ({ tournamentRepository, playerRepository }) => async ({ tournamentId, playerId, points = 0 }) => {
  if (!tournamentId || !playerId) throw new Error('tournamentId and playerId are required');
  const player = await playerRepository.findById(playerId);
  if (!player) throw new Error('Player not found');
  const tournament = await tournamentRepository.findById(tournamentId);
  if (!tournament) throw new Error('Tournament not found');
  return tournamentRepository.addPlayer(tournamentId, playerId, points);
};