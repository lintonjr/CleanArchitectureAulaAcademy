const { body, param } = require('express-validator');


const validate = (validations) => async (req, res, next) => {
  for (const validation of validations) { await validation.run(req); }
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return res.status(400).json({ errors: errors.array() });
};


module.exports = {
  validate,
  createLeague: validate([body('name').isString().trim().notEmpty()]),
  updateLeague: validate([param('id').isInt(), body('name').optional().isString().trim().notEmpty()]),
  createTournament: validate([
    body('leagueId').isInt(),
    body('name').isString().trim().notEmpty(),
    body('date').isISO8601(),
    body('numRounds').isInt({ min: 1 })
  ]),
  updateTournament: validate([
    param('id').isInt(),
    body('leagueId').optional().isInt(),
    body('name').optional().isString().trim().notEmpty(),
    body('date').optional().isISO8601(),
    body('numRounds').optional().isInt({ min: 1 })
  ]),
  createPlayer: validate([body('name').isString().trim().notEmpty(), body('email').isEmail()]),
  updatePlayer: validate([param('id').isInt(), body('name').optional().isString().trim().notEmpty(), body('email').optional().isEmail()]),
  addPlayerToTournament: validate([param('tournamentId').isInt(), body('playerId').isInt(), body('points').optional().isInt({ min: 0 })])
};