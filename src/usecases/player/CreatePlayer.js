module.exports = ({ playerRepository }) => async ({ name, email }) => {
  if (!name || !email) throw new Error('name and email are required');
  return playerRepository.create({ name, email });
};