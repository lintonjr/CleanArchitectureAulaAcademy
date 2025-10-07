## Sumário

- [Sumário](#sumário)
- [Visão Geral de Camadas](#visão-geral-de-camadas)
- [Princípio de Dependência (setas para dentro)](#princípio-de-dependência-setas-para-dentro)
- [Bootstrapping (app/server)](#bootstrapping-appserver)
- [Ciclo Genérico de Request/Response](#ciclo-genérico-de-requestresponse)
- [Fluxos Detalhados](#fluxos-detalhados)
  - [Criar Liga](#criar-liga)
  - [Criar Torneio (valida liga)](#criar-torneio-valida-liga)
  - [Associar Jogador ao Torneio (+ pontos)](#associar-jogador-ao-torneio--pontos)
  - [Relatório por Liga (pontos acumulados)](#relatório-por-liga-pontos-acumulados)
- [Modelo de Dados (conceitual)](#modelo-de-dados-conceitual)
- [Associações Sequelize](#associações-sequelize)
- [Repositórios: Contratos vs Implementações](#repositórios-contratos-vs-implementações)
- [Validações HTTP](#validações-http)
- [Migrations e CLI](#migrations-e-cli)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Endpoints](#endpoints)
- [Padrões de Resposta HTTP](#padrões-de-resposta-http)
- [Erros Comuns \& Troubleshooting](#erros-comuns--troubleshooting)
- [Testabilidade (mocks/stubs)](#testabilidade-mocksstubs)
- [Evoluções Sugeridas](#evoluções-sugeridas)

---

## Visão Geral de Camadas

**Clean Architecture** separa o código por responsabilidades, para que regras de negócio não dependam de frameworks ou banco.

- **Interfaces (Entradas/Adapters)** – Onde o mundo externo entra (HTTP via Express): rotas, validação e transformação de requests/responses.
- **Use Cases (Application)** – Regras **de aplicação**: orquestram passos, chamam repositórios **via contratos**, tratam erros de negócio.
- **Domain** – Entidades e **interfaces** (contratos) de repositório. **Não** conhece banco, ORM ou Express.
- **Infrastructure** – Implementações técnicas: ORM (Sequelize), Models, Repositórios concretos, DB config, migrations.

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

---

## Princípio de Dependência (setas para dentro)

- Use Cases dependem **apenas** de **contratos** do Domain (ex.: `LeagueRepository`).
- Interfaces chamam Use Cases (injeção de dependências), mas **não** contêm regras de negócio.
- Infrastructure implementa os contratos (ex.: `SequelizeLeagueRepository`) e conhece Sequelize/MySQL.
- Trocar o banco (MySQL → Postgres) afeta **só** a camada Infrastructure.

---

## Bootstrapping (app/server)

- `src/app.js`: cria a app Express, registra middlewares (JSON, morgan) e monta `/api`.
- `src/server.js`: autentica conexão (`sequelize.authenticate()`), loga e **só então** dá `listen(...)`.

Essa ordem garante que a API sobe **apenas** se o DB estiver ok.

---

## Ciclo Genérico de Request/Response

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

## Fluxos Detalhados

### Criar Liga

1. **HTTP**: `POST /api/leagues { name }`
2. **Validator**: checa `name`.
3. **Use Case**: `CreateLeague` chama `leagueRepository.create({ name })`.
4. **Infra**: `SequelizeLeagueRepository` → `LeagueModel.create({ name })`.
5. **DB**: INSERT em `leagues`. Retorna `{ id, name }`.

### Criar Torneio (valida liga)

1. **HTTP**: `POST /api/tournaments { leagueId, name, date, numRounds }`
2. **Validator**: checa campos.
3. **Use Case**: `CreateTournament` primeiro valida `leagueRepository.findById(leagueId)`.
4. **Infra**: `SequelizeTournamentRepository.create` → `TournamentModel.create({ league_id, name, date, num_rounds })`.
5. **DB**: INSERT em `tournaments`. Retorna `{ id, leagueId, name, date, numRounds }`.

### Associar Jogador ao Torneio (+ pontos)

1. **HTTP**: `POST /api/tournaments/:tournamentId/players { playerId, points? }`
2. **Use Case**: `AddPlayerToTournament` valida existência de jogador/torneio (via repositórios) e chama `tournamentRepository.addPlayer(...)`.
3. **Infra**: `SequelizeTournamentRepository.addPlayer` usa `TournamentPlayer.findOrCreate(...)` e, se já existe, `update({ points })`.
4. **DB**: UPSERT em `tournament_players` (unique `(tournament_id, player_id)`).

### Relatório por Liga (pontos acumulados)

1. **HTTP**: `GET /api/leagues/:leagueId/players-with-points`
2. **Use Case**: `ListLeaguePlayersWithPoints` faz `SUM(points)` por `Player`, filtrando `Tournament.league_id = :leagueId`.
3. **Infra**: Query com `TournamentPlayer` + `Player` + `Tournament`, `GROUP BY Player.id`, `ORDER BY total_points DESC`.

---

## Modelo de Dados (conceitual)

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

## Associações Sequelize

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

## Repositórios: Contratos vs Implementações

- **Contratos (Domain)**: interfaces que definem *o que* a aplicação precisa (ex.: `LeagueRepository`, `TournamentRepository`, `PlayerRepository`).
- **Implementações (Infrastructure)**: classes que usam Sequelize para entregar *como* cada contrato é cumprido (ex.: `SequelizeLeagueRepository`).

**Benefícios:**
- Testes de Use Case sem banco (mock dos repositórios).
- Troca de ORM/DB sem afetar Use Cases e Interfaces.

---

## Validações HTTP

- `express-validator` em `interfaces/http/validators.js`.
- Garante formato e presença dos campos **antes** de chegar nos Use Cases (reduz erro de domínio).
- Ex.: `createTournament` valida `leagueId`, `name`, `date` (ISO 8601) e `numRounds`.

---

## Migrations e CLI

- Migrations em `migrations/` (via `sequelize-cli`).
- Scripts no `package.json`:

```bash
npm run migrate       # aplica todas as migrations
npm run rollback      # desfaz todas
npx sequelize db:create  # opcional: cria o DB
```

**Ordem sugerida:**
1. `cp .env.example .env` e configure `DB_*`.
2. `npm install`.
3. `npx sequelize db:create` (se necessário).
4. `npm run migrate`.
5. `npm run dev` para subir a API.

---

## Variáveis de Ambiente

```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=secret
DB_NAME=league_tournament
PORT=3000
NODE_ENV=development
```

- `config/config.js` segue o padrão do `sequelize-cli` para ambientes.

---

## Endpoints

**Prefixo:** `/api`

- **Leagues**
  - `POST /leagues` { name }
  - `GET /leagues`
  - `PUT /leagues/:id` { name }
  - `DELETE /leagues/:id`
  - `GET /leagues/:id/players-with-points` → `[ { id, name, email, total_points } ]`

- **Tournaments**
  - `POST /tournaments` { leagueId, name, date (YYYY-MM-DD), numRounds }
  - `GET /tournaments`
  - `PUT /tournaments/:id` { leagueId?, name?, date?, numRounds? }
  - `DELETE /tournaments/:id`
  - `POST /tournaments/:tournamentId/players` { playerId, points? }

- **Players**
  - `POST /players` { name, email }
  - `GET /players`
  - `PUT /players/:id` { name?, email? }
  - `DELETE /players/:id`

---

## Padrões de Resposta HTTP

- **201 Created** (criação bem-sucedida): cria Liga/Torneio/Jogador/Associação.
- **200 OK** (consultas e updates): retorna dados atualizados/consultados.
- **204 No Content** (delete): operação sem corpo de resposta.
- **400 Bad Request** (validação/regra de negócio): campos faltando, liga inexistente, etc.
- **500 Internal Server Error** (falha inesperada): logs para investigar.

---

## Erros Comuns & Troubleshooting

- **ECONNREFUSED / Auth Failed**: MySQL não está rodando ou credenciais (`DB_*`) incorretas.
- **Migrations não rodam**: cheque se o `config/config.js` aponta pro mesmo DB do `.env` (ambiente `development`).
- **Unique constraint (players.email)**: tente cadastrar email já existente.
- **Unique (tournament_id, player_id)**: jogador já associado ao torneio; use o mesmo endpoint para **atualizar `points`**.
- **Formato de data**: use `YYYY-MM-DD` em `date` (DATEONLY).

---

## Testabilidade (mocks/stubs)

- **Use Cases** recebem repositórios por injeção: nos testes, passe **mocks** em vez de repositórios Sequelize.
- Ex.: para `CreateTournament`, simule `leagueRepository.findById` retornando `null` para testar erro de regra de negócio.

---

## Evoluções Sugeridas

- **Transações** (`sequelize.transaction`) ao associar múltiplos jogadores de uma vez.
- **Seeders** para dados iniciais (ligas, jogadores, torneios de exemplo).
- **Swagger/OpenAPI** para documentação da API.
- **Middlewares** de autenticação/autorização (JWT) e tratador global de erros.
- **Camada de Controllers** dedicada, caso a lógica de transformação em `routes.js` cresça.
- **Métricas/Auditoria** (logs por request, tempos de DB, etc.).

---

