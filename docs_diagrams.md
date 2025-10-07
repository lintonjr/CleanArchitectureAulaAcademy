# Clean Architecture – League/Tournament API

---

## 1) Visão de Camadas (dependências apontam para dentro)

```
[ HTTP Client ]
      |
      v
[ Interfaces / Entradas ]
  Express Routes + Validators
      |
      v
[ Use Cases (Application) ]
  Orquestram regras do app
      |
      v
[ Domain ]
  Entidades + Contratos (Repos)
      |
      v
[ Infrastructure ]
  Sequelize Repositories + Models
      |
      v
[ MySQL (Persistência) ]
```

**Regra de ouro:** Interfaces/UseCases dependem de **contratos** do domínio; apenas **Infrastructure** conhece Sequelize/MySQL.

---

## 2) Ciclo Genérico de Request/Response

```
Client
  |
  |  HTTP (JSON)
  v
Express (routes.js) ----> Validators (express-validator)
  |                           |
  |<---------- ok ------------|
  |
  |  chama caso de uso (injeta repos)
  v
UseCase
  |
  |  usa contratos (ex.: LeagueRepository)
  v
Sequelize*Repository (implementação concreta)
  |
  |  chama Model Sequelize
  v
Sequelize Model
  |
  |  SQL gerado (INSERT/SELECT/UPDATE/DELETE)
  v
MySQL
  |
  |  resultado
  v
Express responde JSON ao Client
```

---

## 3) Fluxo: Criar Liga

```
Client
  |
  | POST /api/leagues  body:{ name }
  v
Express routes
  |
  |--> validators.createLeague  (name obrigatório)
  |        |
  |        'ok'
  v
UseCase: CreateLeague
  |
  |--> LeagueRepository.create({ name })
        |
        v
     SequelizeLeagueRepository
        |
        |--> LeagueModel.create({ name })
               |
               v
            MySQL INSERT INTO leagues(name)
               |
               v
        Liga criada (id, name)
               |
               v
Express -> 201 { id, name }
```

---

## 4) Fluxo: Criar Torneio (valida liga existente)

```
Client
  |
  | POST /api/tournaments
  | body:{ leagueId, name, date, numRounds }
  v
Express routes
  |
  |--> validators.createTournament
  |
  v
UseCase: CreateTournament
  |
  |-- verifica liga:
  |   leagueRepository.findById(leagueId)
  |        |
  |        +--> SequelizeLeagueRepository -> LeagueModel.findByPk
  |        |
  |        +--> se null => Error("League not found")
  |
  |-- cria torneio:
  |   tournamentRepository.create({ leagueId, name, date, numRounds })
  |        |
  |        +--> SequelizeTournamentRepository
  |                |
  |                +--> TournamentModel.create({
  |                        league_id, name, date, num_rounds
  |                    })
  |                        |
  |                        +--> MySQL INSERT INTO tournaments(...)
  |
  v
Express -> 201 { id, leagueId, name, date, numRounds }
```

---

## 5) Fluxo: Associar Jogador ao Torneio (+ pontos)

```
Client
  |
  | POST /api/tournaments/:tId/players
  | body:{ playerId, points? }
  v
Express routes
  |
  |--> validators.addPlayerToTournament
  |
  v
UseCase: AddPlayerToTournament
  |
  |-- valida existências:
  |   playerRepository.findById(playerId)
  |   tournamentRepository.findById(tId)
  |     (se algum não existe => Error)
  |
  |-- persiste associação/pontos:
  |   tournamentRepository.addPlayer(tId, playerId, points=0)
  |        |
  |        +--> SequelizeTournamentRepository
  |               |
  |               +--> TournamentPlayerModel.findOrCreate({
  |                     where: { tournament_id: tId, player_id: playerId },
  |                     defaults: { points }
  |                   })
  |                     |
  |                     +--> se já existe: update({ points })
  |
  v
Express -> 201 { tournament_id, player_id, points }
```

> **Nota:** há `unique(tournament_id, player_id)` para impedir duplicatas.

---

## 6) Fluxo: Relatório – Jogadores da Liga com Pontos Acumulados

```
Client
  |
  | GET /api/leagues/:leagueId/players-with-points
  v
Express routes
  |
  v
UseCase: ListLeaguePlayersWithPoints
  |
  |-- consulta agregada via TournamentPlayer:
  |   SUM(points) por Player, filtrando Tournament.league_id = :leagueId
  |
  |   (associações necessárias):
  |     TournamentPlayer.belongsTo(Player, { as: 'Player' })
  |     TournamentPlayer.belongsTo(Tournament, { as: 'Tournament' })
  |
  |-- Query (conceitual):
  |   SELECT p.id, p.name, p.email, SUM(tp.points) AS total_points
  |   FROM tournament_players tp
  |   JOIN tournaments t ON t.id = tp.tournament_id
  |   JOIN players p    ON p.id = tp.player_id
  |   WHERE t.league_id = :leagueId
  |   GROUP BY p.id
  |   ORDER BY total_points DESC;
  |
  v
Express -> 200
[
  { id, name, email, total_points },
  ...
]
```

---

## 7) Padrões CRUD (Editar / Deletar)

### Editar (ex.: `PUT /api/players/:id`)
```
Client -> Express -> validators.updatePlayer
      -> UseCase(UpdatePlayer)
      -> PlayerRepository.update(id, { name?, email? })
      -> SequelizePlayerRepository -> PlayerModel.update(...)
      -> MySQL
      -> Express 200 { id, name, email }
```

### Deletar (ex.: `DELETE /api/leagues/:id`)
```
Client -> Express -> UseCase(DeleteLeague)
      -> LeagueRepository.delete(id)
      -> SequelizeLeagueRepository -> LeagueModel.destroy({ where: { id } })
      -> MySQL (CASCADE nos torneios da liga)
      -> Express 204 (sem corpo)
```

---

## 8) Modelo de Dados (conceitual)

```
leagues
- id (PK)
- name (unique)
- created_at, updated_at

players
- id (PK)
- name
- email (unique)
- created_at, updated_at

tournaments
- id (PK)
- league_id (FK -> leagues.id, CASCADE)
- name
- date (DATEONLY)
- num_rounds (INT)
- created_at, updated_at

tournament_players
- id (PK)
- tournament_id (FK -> tournaments.id, CASCADE)
- player_id (FK -> players.id, CASCADE)
- points (INT default 0)
- unique (tournament_id, player_id)
- created_at, updated_at
```

---

## 9) Associações Sequelize (resumo)

```js
// liga <-> torneio (1:N)
Tournament.belongsTo(League, { foreignKey: 'league_id', as: 'league' });
League.hasMany(Tournament, { foreignKey: 'league_id', as: 'tournaments' });

// jogador <-> torneio (N:N via TournamentPlayer)
Player.belongsToMany(Tournament, {
  through: TournamentPlayer,
  foreignKey: 'player_id',
  otherKey: 'tournament_id',
  as: 'tournaments'
});
Tournament.belongsToMany(Player, {
  through: TournamentPlayer,
  foreignKey: 'tournament_id',
  otherKey: 'player_id',
  as: 'players'
});

// para relatório (joins diretos na junction)
TournamentPlayer.belongsTo(Player, { foreignKey: 'player_id', as: 'Player' });
TournamentPlayer.belongsTo(Tournament, { foreignKey: 'tournament_id', as: 'Tournament' });
```

---

## 10) Endpoints (resumo) – prefixo `/api`

- **Leagues**: `POST /leagues`, `GET /leagues`, `PUT /leagues/:id`, `DELETE /leagues/:id`, `GET /leagues/:id/players-with-points`
- **Tournaments**: `POST /tournaments`, `GET /tournaments`, `PUT /tournaments/:id`, `DELETE /tournaments/:id`, `POST /tournaments/:tournamentId/players`
- **Players**: `POST /players`, `GET /players`, `PUT /players/:id`, `DELETE /players/:id`

---

## 11) Glossário Rápido

- **Interfaces**: entradas do sistema (HTTP). Controllers finos.
- **Use Cases**: regras de aplicação (orquestração) – não conhecem DB.
- **Domain**: entidades e **contratos** de repositório.
- **Infrastructure**: Sequelize (models, repositórios concretos), migrations, conexão.

---

## 12) Dicas de Evolução

- Transações (`sequelize.transaction`) para operações em lote.
- Seeds para dados iniciais (ex.: uma liga, alguns jogadores e um torneio).
- Swagger/OpenAPI para documentar a API.
- Middlewares de erro e autenticação (JWT) conforme necessário.

---

**FIM**

