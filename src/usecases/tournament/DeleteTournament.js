module.exports = ({ tournamentRepository }) => async ({ id }) => {
  if (!id) throw new Error('id is required');
  await tournamentRepository.delete(id);
  return { success: true };
};