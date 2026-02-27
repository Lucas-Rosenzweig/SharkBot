## Récapitulatif de l'implémentation

### 🔧 API Express (côté bot)
| Fichier | Rôle |
|---|---|
| `src/api/server.ts` | Serveur Express (port 3001), CORS, sessions, Passport Discord OAuth2, rate limiting |
| `src/api/middleware/auth.ts` | Middlewares `requireAuth` + `requireGuildAdmin` (vérifie perm ADMINISTRATOR) |
| `src/api/routes/auth.ts` | OAuth2 Discord : `/api/auth/discord`, callback, `/api/auth/me`, `/api/auth/logout` |
| `src/api/routes/guilds.ts` | `GET /api/guilds` (intersection user guilds ∩ bot guilds), `/:guildId/channels`, `/:guildId/roles` |
| `src/api/routes/config.ts` | `GET/PUT /api/guilds/:guildId/config` via `ConfigService` |
| `src/api/routes/levelRoles.ts` | `GET/POST/DELETE /api/guilds/:guildId/level-roles` via Prisma |
| `src/api/routes/reactionRoles.ts` | `GET/POST/DELETE` — le POST **trigger le bot** pour réagir au message Discord, le DELETE retire la réaction |
| `src/api/routes/users.ts` | `GET /api/guilds/:guildId/users` — leaderboard paginé |
| `src/index.ts` | Modifié : appelle `startApiServer(client)` après `client.login()` |

### 🎨 Dashboard React (Vite + Tailwind + React Router)
| Fichier | Rôle |
|---|---|
| `dashboard/src/context/AuthContext.tsx` | Context OAuth2, fetch `/api/auth/me`, gestion état connexion |
| `dashboard/src/lib/api.ts` | Client Axios configuré avec `withCredentials` |
| `dashboard/src/App.tsx` | Routeur avec routes protégées |
| `dashboard/src/pages/Login.tsx` | Page de connexion Discord OAuth2 |
| `dashboard/src/pages/GuildSelect.tsx` | Sélection du serveur (cartes avec icônes) |
| `dashboard/src/pages/Dashboard.tsx` | Layout sidebar + Outlet pour les sous-pages |
| `dashboard/src/pages/ConfigPage.tsx` | Config XP : cooldown, XP/message, XP/minute, channel annonce, toggle unmute |
| `dashboard/src/pages/LevelRolesPage.tsx` | CRUD rôles de niveau (dropdown rôle + input level) |
| `dashboard/src/pages/ReactionRolesPage.tsx` | CRUD reaction roles (trigger bot pour réagir via API) |
| `dashboard/src/pages/LeaderboardPage.tsx` | Classement paginé des users par XP |
| `dashboard/vite.config.ts` | Tailwind + proxy `/api` → `localhost:3001` en dev |

### 🐳 Infrastructure Docker
| Fichier | Rôle |
|---|---|
| `Dockerfile` | Multi-stage bot : `build` (tsc) → `runtime` (node alpine + entrypoint) |
| `entrypoint.sh` | `prisma migrate deploy` puis `node dist/index.js` |
| `dashboard/Dockerfile` | Multi-stage front : `build` (vite build) → `runtime` (nginx alpine) |
| `dashboard/nginx.conf` | SPA fallback + proxy `/api` → `http://bot:3001` |
| `docker-compose.yml` | 3 services (`db`, `bot`, `dashboard`) sur réseau `shark-net`, healthcheck PG |
| `docker-compose.override.yml` | Dev : volumes montés, hot reload (`pnpm dev`), ports exposés (5432, 3001, 5173) |
| `.dockerignore` | Exclut node_modules, dist, .git |
| `.env.example` | Toutes les variables requises documentées |

### Utilisation

**Dev (hot reload)** :
```bash
docker compose up
```
→ DB sur :5432, API bot sur :3001, Dashboard Vite sur :5173

**Prod** :
```bash
docker compose -f docker-compose.yml up -d
```
→ Dashboard Nginx sur :80, proxy `/api` vers le bot interne

**OAuth2** : configurer le redirect URI dans le [Discord Developer Portal](https://discord.com/developers/applications) → `http://localhost:3001/api/auth/discord/callback` (dev) ou `https://ton-domaine.com/api/auth/discord/callback` (prod).

