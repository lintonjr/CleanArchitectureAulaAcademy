module.exports = ({ playerRepository }) => async ({ id, name, email }) => {
  if (!id) throw new Error('id is required');
  return playerRepository.update(id, { name, email });
};