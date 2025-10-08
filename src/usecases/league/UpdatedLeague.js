module.exports = ({ leagueRepository }) => async ({ id, name }) => {
  if (!id) throw new Error('id is required');
  return leagueRepository.update(id, { name });
};