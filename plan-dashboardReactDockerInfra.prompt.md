## Plan : Dashboard React + Infra Docker complète pour Shark-Bot

Créer un dashboard web React avec authentification Discord OAuth2, exposant une API REST Express dans le bot pour configurer XP, level roles et reaction roles (avec trigger du bot Discord pour les réactions). Le tout orchestré dans Docker Compose (PostgreSQL + bot + dashboard) avec hot reload en dev.

### Steps

1. **Ajouter Discord OAuth2 + API Express dans le bot** — Installer `express`, `cors`, `express-session`, `passport`, `passport-discord` (+ types) dans [package.json](package.json). Créer `src/api/` avec :
   - `src/api/server.ts` — Initialise Express sur le port 3001, configure CORS, sessions, Passport Discord OAuth2 (scopes `identify`, `guilds`). Démarrer le serveur en parallèle du bot dans [index.ts](src/index.ts) après `client.login()`.
   - `src/api/middleware/auth.ts` — Middleware qui vérifie que l'utilisateur est connecté via OAuth2 et qu'il est admin de la guild demandée (croiser `user.guilds` Discord avec les permissions `ADMINISTRATOR`).
   - `src/api/routes/auth.ts` — Routes `/api/auth/discord` (redirect), `/api/auth/discord/callback`, `/api/auth/me` (user info + guilds filtrées), `/api/auth/logout`.
   - `src/api/routes/config.ts` — `GET/PUT /api/guilds/:guildId/config` utilisant `ConfigService` existant.
   - `src/api/routes/levelRoles.ts` — `GET/POST/DELETE /api/guilds/:guildId/level-roles` avec Prisma directement (comme dans [levelRole.ts](src/commands/levelRole.ts)).
   - `src/api/routes/reactionRoles.ts` — `GET /api/guilds/:guildId/reaction-roles` (lecture depuis `ReactionMapService`), `POST` qui **utilise le client Discord.js** pour fetch le message, réagir dessus, puis persister via `ReactionMapService.addReactionMap()`, et `DELETE` qui retire la réaction du bot sur le message Discord puis supprime l'entrée en base.
   - `src/api/routes/guilds.ts` — `GET /api/guilds` (guilds de l'utilisateur OAuth2 intersectées avec celles du bot), `GET /api/guilds/:guildId/channels` et `/roles` (via `client.guilds.fetch()` Discord.js pour exposer les channels texte et rôles au front).
   - `src/api/routes/users.ts` — `GET /api/guilds/:guildId/users` (leaderboard, paginé, trié par xpTotal desc via Prisma).

2. **Passer le `client` Discord.js à l'API** — Exporter le `client` depuis [index.ts](src/index.ts) et le passer à `startApiServer(client)` pour que les routes puissent interagir avec Discord (fetch channels, roles, réagir aux messages, etc.). Les routes reaction roles l'utiliseront pour `channel.messages.fetch(messageId)` puis `message.react(emoji)`.

3. **Créer le front React (Vite + TS + Tailwind + React Router)** — Initialiser `dashboard/` avec `pnpm create vite dashboard --template react-ts`. Installer Tailwind CSS, React Router, et axios. Structure :
   - `src/context/AuthContext.tsx` — Context qui fetch `/api/auth/me`, gère l'état de connexion, redirige vers OAuth2 si non connecté.
   - `src/pages/Login.tsx` — Bouton "Se connecter avec Discord" redirigeant vers `/api/auth/discord`.
   - `src/pages/GuildSelect.tsx` — Liste les guilds de l'utilisateur (depuis `/api/guilds`), cartes cliquables.
   - `src/pages/Dashboard.tsx` — Layout avec sidebar pour une guild sélectionnée, sous-pages :
     - `src/pages/ConfigPage.tsx` — Formulaire : inputs pour xpCooldown, xpPerMessage, xpPerMinute, dropdown pour xpChannelId (alimenté par `/api/guilds/:id/channels`), toggle pour voiceXpRequireUnmuted.
     - `src/pages/LevelRolesPage.tsx` — Tableau des level roles + formulaire d'ajout (dropdown rôle depuis `/api/guilds/:id/roles` + input level) + bouton supprimer.
     - `src/pages/ReactionRolesPage.tsx` — Tableau des reaction maps + formulaire (channelId dropdown, messageId input, emoji input, rôle dropdown, toggle removeOnUnreact) → POST qui trigger le bot pour réagir + bouton supprimer qui trigger le bot pour retirer la réaction.
     - `src/pages/LeaderboardPage.tsx` — Tableau paginé des users trié par XP avec level, xpCurrent, xpTotal.
   - `dashboard/package.json`, `dashboard/vite.config.ts` (proxy `/api` vers `http://localhost:3001` en dev), `dashboard/tailwind.config.js`.

4. **Dockeriser le bot** — Créer `Dockerfile` à la racine :
   - Stage 1 (`build`) : `node:20-alpine`, copier sources, `pnpm install`, `prisma generate`, `tsc`.
   - Stage 2 (`runtime`) : `node:20-alpine`, copier `dist/`, `generated/`, `node_modules/`, `prisma/`. Entrypoint : script qui exécute `prisma migrate deploy` puis `node dist/index.js`. Exposer port 3001.

5. **Dockeriser le front** — Créer `dashboard/Dockerfile` :
   - Stage 1 : `node:20-alpine`, `pnpm install`, `pnpm build` (Vite).
   - Stage 2 : `nginx:alpine`, copier le build dans `/usr/share/nginx/html`. Créer `dashboard/nginx.conf` : servir le SPA (try_files → index.html), proxy `/api` vers `http://bot:3001`.

6. **Refondre [docker-compose.yml](docker-compose.yml) avec hot reload dev** — Fichier principal pour la prod avec 3 services (`db`, `bot`, `dashboard`) sur un network `shark-net`. Variables d'env : `DATABASE_URL`, `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `SESSION_SECRET`, `DASHBOARD_URL` (pour le callback OAuth2). Créer `docker-compose.override.yml` pour le dev :
   - `bot` : volumes montés (`./src:/app/src`, `./prisma:/app/prisma`), commande `pnpm dev`, port 3001 exposé.
   - `dashboard` : volumes montés (`./dashboard/src:/app/src`), commande `pnpm dev` (Vite dev server sur port 5173), port 5173 exposé.
   - `db` : port 5432 exposé pour accès local.

### Further Considerations

1. **Variables d'environnement** — Créer un `.env.example` documentant toutes les variables requises : `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DATABASE_URL`, `SESSION_SECRET`, `DASHBOARD_URL` (ex: `http://localhost:5173` en dev, URL prod sinon).
2. **Gestion des sessions en prod** — `express-session` avec un store en mémoire suffit pour commencer, mais pour scaler il faudrait un Redis (ajout d'un service `redis` dans le compose). Option à considérer plus tard.
3. **Rate limiting API** — Ajouter `express-rate-limit` pour protéger l'API, surtout les routes qui interagissent avec Discord (pour respecter les rate limits Discord).

