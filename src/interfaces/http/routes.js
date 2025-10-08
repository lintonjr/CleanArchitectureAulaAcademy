const express = require('express');
const router = express.Router();


const SequelizeLeagueRepository = require('../../infrastructure/repositories/SequelizeLeagueRepository');
const SequelizeTournamentRepository = require('../../infrastructure/repositories/SequelizeTournamentRepository');
const SequelizePlayerRepository = require('../../infrastructure/repositories/SequelizePlayerRepository');


// Use cases
const CreateLeague = require('../../usecases/league/CreateLeague');
const UpdateLeague = require('../../usecases/league/UpdateLeague');
const DeleteLeague = require('../../usecases/league/DeleteLeague');
const ListLeagues = require('../../usecases/league/ListLeagues');


const CreateTournament = require('../../usecases/tournament/CreateTournament');
const UpdateTournament = require('../../usecases/tournament/UpdateTournament');
const DeleteTournament = require('../../usecases/tournament/DeleteTournament');
const ListTournaments = require('../../usecases/tournament/ListTournaments');


const CreatePlayer = require('../../usecases/player/CreatePlayer');
const UpdatePlayer = require('../../usecases/player/UpdatePlayer');
const DeletePlayer = require('../../usecases/player/DeletePlayer');
const ListPlayers = require('../../usecases/player/ListPlayers');

const AddPlayerToTournament = require('../../usecases/associations/AddPlayerToTournament');
const ListLeaguePlayersWithPoints = require('../../usecases/reporting/ListLeaguePlayersWithPoints');


const v = require('./validators');


// Repositories (injection)
const leagueRepository = new SequelizeLeagueRepository();
const tournamentRepository = new SequelizeTournamentRepository();
const playerRepository = new SequelizePlayerRepository();


// LEAGUES
router.post('/leagues', v.createLeague, async (req, res) => {
  try { const uc = CreateLeague({ leagueRepository }); res.status(201).json(await uc({ name: req.body.name })); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
router.get('/leagues', async (_req, res) => {
  try { const uc = ListLeagues({ leagueRepository }); res.json(await uc()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/leagues/:id', v.updateLeague, async (req, res) => {
  try { const uc = UpdateLeague({ leagueRepository }); res.json(await uc({ id: +req.params.id, name: req.body.name })); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/leagues/:id', async (req, res) => {
  try { const uc = DeleteLeague({ leagueRepository }); await uc({ id: +req.params.id }); res.status(204).send(); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

// TOURNAMENTS
router.post('/tournaments', v.createTournament, async (req, res) => {
  try {
    const uc = CreateTournament({ tournamentRepository, leagueRepository });
    const data = await uc({ leagueId: req.body.leagueId, name: req.body.name, date: req.body.date, numRounds: req.body.numRounds });
    res.status(201).json(data);
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.get('/tournaments', async (_req, res) => {
  try { const uc = ListTournaments({ tournamentRepository }); res.json(await uc()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/tournaments/:id', v.updateTournament, async (req, res) => {
  try {
    const uc = UpdateTournament({ tournamentRepository, leagueRepository });
    res.json(await uc({ id: +req.params.id, leagueId: req.body.leagueId, name: req.body.name, date: req.body.date, numRounds: req.body.numRounds }));
  } catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/tournaments/:id', async (req, res) => {
  try { const uc = DeleteTournament({ tournamentRepository }); await uc({ id: +req.params.id }); res.status(204).send(); }
  catch (err) { res.status(400).json({ error: err.message }); }
});


// PLAYERS
router.post('/players', v.createPlayer, async (req, res) => {
  try { const uc = CreatePlayer({ playerRepository }); res.status(201).json(await uc({ name: req.body.name, email: req.body.email })); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
router.get('/players', async (_req, res) => {
  try { const uc = ListPlayers({ playerRepository }); res.json(await uc()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/players/:id', v.updatePlayer, async (req, res) => {
  try { const uc = UpdatePlayer({ playerRepository }); res.json(await uc({ id: +req.params.id, name: req.body.name, email: req.body.email })); }
  catch (err) { res.status(400).json({ error: err.message }); }
});
router.delete('/players/:id', async (req, res) => {
  try { const uc = DeletePlayer({ playerRepository }); await uc({ id: +req.params.id }); res.status(204).send(); }
  catch (err) { res.status(400).json({ error: err.message }); }
});


// ASSOCIATIONS & REPORTS
router.post('/tournaments/:tournamentId/players', v.addPlayerToTournament, async (req, res) => {
  try { const uc = AddPlayerToTournament({ tournamentRepository, playerRepository }); res.status(201).json(await uc({ tournamentId: +req.params.tournamentId, playerId: req.body.playerId, points: req.body.points ?? 0 })); }
  catch (err) { res.status(400).json({ error: err.message }); }
});


router.get('/leagues/:id/players-with-points', async (req, res) => {
  try { const uc = ListLeaguePlayersWithPoints(); res.json(await uc({ leagueId: +req.params.id })); }
  catch (err) { res.status(400).json({ error: err.message }); }
});


module.exports = router;