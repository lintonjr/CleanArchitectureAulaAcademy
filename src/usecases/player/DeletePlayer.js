module.exports = ({ playerRepository }) => async ({ id }) => {
  if (!id) throw new Error('id is required');
  await playerRepository.delete(id);
  return { success: true };
};