# 🦈 Guide de Déploiement — Shark-Bot

Ce document décrit l'architecture Docker, l'environnement de développement local, et la procédure complète de mise en production via **Coolify**.

---

## Table des matières

1. [Architecture](#1-architecture)
2. [Développement local](#2-développement-local)
3. [Prérequis Production](#3-prérequis-production)
4. [Déploiement avec Coolify](#4-déploiement-avec-coolify)
5. [Premier déploiement — Checklist](#5-premier-déploiement--checklist)
6. [Mise à jour (Déploiement continu)](#6-mise-à-jour-déploiement-continu)
7. [Commandes utiles](#7-commandes-utiles)
8. [Sauvegarde & Restauration de la DB](#8-sauvegarde--restauration-de-la-db)
9. [Rollback](#9-rollback)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Architecture

L'infrastructure repose sur **3 services Docker** :

| Service       | Image / Build         | Port interne | Rôle                                      |
| ------------- | --------------------- | ------------ | ----------------------------------------- |
| **db**        | `postgres:16-alpine`  | 5432         | Base de données PostgreSQL                 |
| **bot**       | `./Dockerfile`        | 3001         | Bot Discord + API Backend (Express)        |
| **dashboard** | `./dashboard/Dockerfile` | 3000      | Frontend Next.js (reverse proxy → API bot) |

### Fichiers Docker Compose

| Fichier                    | Rôle                                                    |
| -------------------------- | ------------------------------------------------------- |
| `docker-compose.yml`       | **Base commune** — définitions partagées dev & prod      |
| `docker-compose.dev.yml`   | **Override dev** — hot-reload, ports exposés, bind mounts |
| `docker-compose.prod.yml`  | **Override prod** — restart policy, logging, Coolify-ready |

### Réseau

- `shark-net` : réseau bridge interne reliant les 3 services.
- En production, **Coolify injecte automatiquement** son propre réseau proxy pour exposer le dashboard en HTTPS.

---

## 2. Développement local

### Prérequis

- [Docker Desktop](https://docs.docker.com/get-docker/) installé
- Un fichier `.env` à la racine (copier depuis `.env.example`)

### Lancement

```bash
# Méthode rapide (via pnpm script)
pnpm docker:dev

# Méthode explicite
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Accès

| Service     | URL                          |
| ----------- | ---------------------------- |
| Dashboard   | http://localhost:3000         |
| API Bot     | http://localhost:3001         |
| PostgreSQL  | `localhost:5432` (user/pass depuis `.env`) |

### Hot-reload

- **Bot** : les fichiers `src/` sont montés en bind mount → `nodemon` redémarre automatiquement.
- **Dashboard** : les fichiers `app/`, `components/`, `lib/` sont montés → Next.js Turbopack recharge à chaud.

### Arrêt

```bash
pnpm docker:dev:down
# ou
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

> **💡 Astuce** : Ajoutez `-v` pour supprimer aussi le volume de la DB (reset complet) :
> ```bash
> docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
> ```

---

## 3. Prérequis Production

- Un serveur (VPS, Raspberry Pi, etc.) avec [Coolify](https://coolify.io) installé
- Un nom de domaine pointant vers le serveur (ex: `shark.votredomaine.com`)
- Le repo Git accessible depuis Coolify (GitHub, GitLab, etc.)
- Une application Discord configurée dans le [Developer Portal](https://discord.com/developers/applications)

---

## 4. Déploiement avec Coolify

### 4.1. Créer le projet dans Coolify

1. Connectez-vous à l'interface Coolify (`https://votre-coolify.com`)
2. Cliquez **+ Add New Resource** → **Docker Compose**
3. Sélectionnez votre source Git (GitHub, repo privé, etc.)
4. Renseignez le repo et la branche (`main` ou `master`)

### 4.2. Configuration du Docker Compose dans Coolify

Dans les paramètres de la ressource Coolify :

- **Docker Compose Location** : Sélectionnez les fichiers suivants (ou collez le contenu fusionné) :
  ```
  docker-compose.yml + docker-compose.prod.yml
  ```
  > Coolify supporte la syntaxe multi-fichier. Dans le champ "Docker Compose", vous pouvez coller le contenu fusionné de `docker-compose.yml` ET `docker-compose.prod.yml` en un seul bloc YAML.

- **Exposed service** : Sélectionnez le service `dashboard` (port `3000`)

### 4.3. Configurer les variables d'environnement

Dans l'onglet **Environment Variables** de Coolify, ajoutez :

| Variable                | Valeur                                  | Obligatoire |
| ----------------------- | --------------------------------------- | ----------- |
| `DISCORD_TOKEN`         | Token du bot Discord                    | ✅          |
| `DISCORD_CLIENT_ID`     | Client ID de l'app Discord              | ✅          |
| `DISCORD_CLIENT_SECRET` | Client Secret de l'app Discord          | ✅          |
| `SESSION_SECRET`        | Clé aléatoire (`openssl rand -hex 32`)  | ✅          |
| `POSTGRES_USER`         | Ex: `shark_prod`                        | ✅          |
| `POSTGRES_PASSWORD`     | Mot de passe fort et aléatoire          | ✅          |
| `POSTGRES_DB`           | Ex: `sharkbot`                          | ✅          |
| `API_URL`               | `https://shark.votredomaine.com`        | ✅          |
| `DASHBOARD_URL`         | `https://shark.votredomaine.com`        | ✅          |

> ⚠️ **IMPORTANT** : `API_URL` et `DASHBOARD_URL` doivent être votre URL **publique** (avec `https://`). Discord en a besoin pour les redirections OAuth2.

### 4.4. Configurer le domaine

Dans l'onglet **Domains** de la ressource Coolify :
1. Ajoutez `shark.votredomaine.com`
2. Activez le **HTTPS** (Coolify génère un certificat Let's Encrypt automatiquement)
3. Vérifiez que le DNS pointe vers l'IP de votre serveur Coolify

### 4.5. Configurer Discord Developer Portal

1. Allez sur [Discord Developer Portal](https://discord.com/developers/applications) → votre application
2. Onglet **OAuth2** → **Redirects** → Ajoutez :
   ```
   https://shark.votredomaine.com/api/auth/discord/callback
   ```

### 4.6. Déployer

Cliquez **Deploy** dans Coolify. C'est tout ! Coolify va :
1. Cloner le repo
2. Builder les images Docker (bot + dashboard)
3. Démarrer PostgreSQL, attendre le healthcheck
4. Lancer le bot (qui exécute `prisma migrate deploy` automatiquement)
5. Lancer le dashboard
6. Configurer le reverse proxy + HTTPS automatiquement

---

## 5. Premier déploiement — Checklist

- [ ] Repo Git connecté à Coolify
- [ ] Variables d'environnement configurées dans Coolify
- [ ] Domaine configuré + DNS pointé vers le serveur
- [ ] Redirect URI ajoutée dans Discord Developer Portal
- [ ] Premier déploiement lancé ✅
- [ ] Déployer les commandes slash Discord (voir ci-dessous)

### Déployer les commandes Slash (obligatoire au 1er lancement)

Après le premier déploiement, les commandes slash du bot doivent être enregistrées auprès de Discord :

```bash
# Via Coolify → Terminal du service bot (ou SSH sur le serveur)
docker compose exec bot npx tsx src/scripts/deploy-global.ts
```

> Vous pouvez aussi accéder au terminal du conteneur `bot` directement depuis l'UI Coolify.

---

## 6. Mise à jour (Déploiement continu)

### Méthode 1 : Redéploiement automatique (recommandé)

Activez le **webhook** dans les paramètres Coolify pour déclencher un redéploiement automatique à chaque `push` sur la branche principale.

### Méthode 2 : Redéploiement manuel

1. Poussez vos changements sur le repo Git
2. Dans Coolify, cliquez **Redeploy** sur la ressource

### Méthode 3 : Depuis le serveur (SSH)

```bash
cd /chemin/vers/shark-bot
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Si les commandes slash ont changé

```bash
docker compose exec bot npx tsx src/scripts/deploy-global.ts
```

---

## 7. Commandes utiles

### Logs

```bash
# Tous les services
docker compose logs -f

# Un service spécifique
docker compose logs -f bot
docker compose logs -f dashboard
docker compose logs -f db

# Les 100 dernières lignes du bot
docker compose logs --tail=100 bot
```

### Redémarrage

```bash
# Redémarrer un seul service
docker compose restart bot

# Reconstruire + redémarrer un service
docker compose up -d --build bot
```

### Prisma (sur le conteneur bot)

```bash
# Appliquer les migrations
docker compose exec bot npx prisma migrate deploy

# Ouvrir Prisma Studio (port 5555)
docker compose exec bot npx prisma studio

# Reset DB (⚠️ supprime toutes les données)
docker compose exec bot npx prisma migrate reset
```

### Shell dans un conteneur

```bash
docker compose exec bot sh
docker compose exec dashboard sh
docker compose exec db psql -U shark -d sharkbot
```

---

## 8. Sauvegarde & Restauration de la DB

### Sauvegarde manuelle

```bash
# Créer un dump SQL
docker compose exec db pg_dump -U shark sharkbot > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restauration

```bash
# Restaurer depuis un dump
cat backup_XXXXXXXX_XXXXXX.sql | docker compose exec -T db psql -U shark -d sharkbot
```

### Sauvegarde automatique (cron)

Ajoutez cette ligne à votre crontab (`crontab -e`) sur le serveur :

```cron
# Backup quotidien à 3h du matin
0 3 * * * cd /chemin/vers/shark-bot && docker compose exec -T db pg_dump -U shark sharkbot | gzip > /backups/sharkbot_$(date +\%Y\%m\%d).sql.gz
```

---

## 9. Rollback

### Via Coolify

Coolify conserve un historique des déploiements. Cliquez sur un déploiement précédent pour revenir en arrière.

### Manuellement

```bash
# Revenir au commit précédent
git log --oneline -5          # Trouver le hash du commit
git checkout <commit-hash>
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Rollback de la DB

Si une migration a causé un problème, restaurez depuis le dernier backup :

```bash
# 1. Arrêter le bot
docker compose stop bot

# 2. Restaurer la DB
cat backup_XXXXXXXX.sql | docker compose exec -T db psql -U shark -d sharkbot

# 3. Redémarrer
docker compose start bot
```

---

## 10. Troubleshooting

### Le dashboard affiche une erreur 502

- Le bot n'a pas encore démarré. Vérifiez : `docker compose logs bot`
- Le healthcheck de la DB a échoué. Vérifiez : `docker compose logs db`

### OAuth2 redirige vers localhost

- Vérifiez que `API_URL` et `DASHBOARD_URL` sont configurés avec l'URL **publique** (`https://...`) dans les variables Coolify.
- Vérifiez que la redirect URI est ajoutée dans Discord Developer Portal.

### Les commandes slash ne s'affichent pas

```bash
docker compose exec bot npx tsx src/scripts/deploy-global.ts
```
> Les commandes globales peuvent mettre jusqu'à 1h pour se propager. Pour tester instantanément, utilisez `deploy:guild`.

### La DB ne se crée pas

Vérifiez que `POSTGRES_PASSWORD` est bien défini (pas vide). Le docker-compose échouera si cette variable est manquante grâce au guard `${POSTGRES_PASSWORD:?...}`.

### Erreur "prisma migrate deploy" au démarrage

```bash
# Se connecter au conteneur et vérifier l'état des migrations
docker compose exec bot npx prisma migrate status
```
