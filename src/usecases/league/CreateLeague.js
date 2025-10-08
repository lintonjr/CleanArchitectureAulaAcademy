module.exports = ({ leagueRepository }) => async ({ name }) => {
  if (!name) throw new Error('name is required');
  return leagueRepository.create({ name });
};