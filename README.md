## Setup
1. `.env`
```bash
cp .env.example .env
# ajuste DB_*
```
2. Instalar deps:
```bash
npm install
```
3. Criar DB no MySQL:
```sql
CREATE DATABASE league_tournament CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
4. Rodar migrations (sequelize-cli):
```bash
npm run migrate
```
5. Subir a API:
```bash
npm run dev
```


## Endpoints (`/api`)
- **Leagues**: `POST /leagues`, `GET /leagues`, `PUT /leagues/:id`, `DELETE /leagues/:id`, `GET /leagues/:id/players-with-points`
- **Tournaments**: `POST /tournaments`, `GET /tournaments`, `PUT /tournaments/:id`, `DELETE /tournaments/:id`, `POST /tournaments/:tournamentId/players`
- **Players**: `POST /players`, `GET /players`, `PUT /players/:id`, `DELETE /players/:id`


## Observações de Arquitetura
- **domain/**: entidades e contratos de repositório (agnóstico de DB)
- **usecases/**: regras de aplicação
- **infrastructure/**: Sequelize (models, repos) e conexão
- **interfaces/http/**: Express (rotas + validação)
```