module.exports = ({ leagueRepository }) => async ({ id }) => {
  if (!id) throw new Error('id is required');
  await leagueRepository.delete(id);
  return { success: true };
};