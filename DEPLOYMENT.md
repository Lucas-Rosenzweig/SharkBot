# Guide de Déploiement en Production (Mise en Prod)

Ce document décrit les étapes nécessaires pour déployer le Dashboard et le Bot complet (Shark-Bot) sur un serveur de production à l'aide de Docker Compose.

L'architecture s'appuie sur trois conteneurs distincts :
1. **db** : Base de données PostgreSQL 16.
2. **bot** : Bot Discord (Node.js) qui sert également d'API Backend sur son port 3001 (en interne).
3. **dashboard** : Application front-end Next.js qui expose l'interface utilisateur sur le port 80 et redirige les appels `/api` vers l'API interne du bot.

---

## 1. Prérequis

Assurez-vous que votre environnement dispose de :
- [Docker](https://docs.docker.com/get-docker/) et de l'extension [Docker Compose](https://docs.docker.com/compose/install/) installés.
- Un nom de domaine. *(Exemple : `shark.mondomaine.com`)*.

---

## 2. Hébergement à Domicile (Raspberry Pi)

Puisque le bot est hébergé sur un Raspberry Pi chez vos parents (derrière une box internet classique), vous ne pouvez pas simplement faire pointer votre nom de domaine vers l'IP de la box sans quelques réglages (l'IP de la box change souvent, et les ports de la box sont fermés par défaut).

Voici les deux solutions recommandées :

### Solution 1 (Recommandée & Plus sécurisée) : Cloudflare Tunnels
C'est la méthode la plus simple pour accéder à un appareil local depuis l'extérieur **sans ouvrir aucun port sur la box internet**.
1. Créez un compte gratuit sur [Cloudflare](https://dash.cloudflare.com/) et ajoutez-y votre nom de domaine.
2. Allez dans **Zero Trust** -> **Networks** -> **Tunnels** et créez un tunnel.
3. Le site vous donnera une commande Docker à lancer sur votre Raspberry Pi.
4. Dans l'interface Cloudflare, configurez un "Public Hostname" (`shark.mondomaine.com`) pour pointer vers le port local de votre dashboard (ex: `http://localhost:80`).
5. **Avantage :** Pas besoin de toucher à la configuration de la box des parents, IP dynamique gérée automatiquement, et certificat HTTPS gratuit inclus.

### Solution 2 (Classique) : Redirection de Ports + IP Dynamique + Traefik
Si vous ne souhaitez pas utiliser Cloudflare, voici la méthode complète avec le reverse proxy **Traefik** (qui s'occupera de générer automatiquement vos certificats HTTPS Let's Encrypt).

#### A. Préparation du Réseau et de la Box
1. **IP Dynamique (DDNS) :** La box de vos parents change probablement d'IP publique. Utilisez un service comme **DuckDNS** (ou le service DDNS de votre registrar) pour que `shark.mondomaine.com` pointe toujours vers l'IP de la box.
2. **Ouverture des Ports (Box Internet) :**
   - Connectez-vous à l'interface de la box internet de vos parents (ex: `192.168.1.1`).
   - Allez dans la section Réseau / NAT / Transfert de Port.
   - Redirigez les flux entrants tcp sur les ports **80** (HTTP) et **443** (HTTPS) vers l'IP locale du Raspberry Pi sur votre réseau (ex: `192.168.1.50`).

#### B. Installation de Traefik avec Docker Compose
Créez un réseau Docker partagé (si ce n'est pas déjà fait) pour que Traefik puisse communiquer avec vos autres conteneurs :
```bash
docker network create web
```

Créez un dossier dédié pour Traefik et son fichier `docker-compose.yml` :
```bash
mkdir traefik && cd traefik
nano docker-compose.yml
```

Insérez cette configuration **Traefik** (remplacez `votre-email@email.com` par votre vraie adresse) :
```yaml
services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    networks:
      - web
    ports:
      - 80:80
      - 443:443
    volumes:
      - /etc/localtime:/etc/localtime:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./data/acme.json:/acme.json
    command:
      - --api.insecure=false
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --providers.docker.network=web
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=https
      - --certificatesresolvers.myresolver.acme.tlschallenge=true
      - --certificatesresolvers.myresolver.acme.email=votre-email@email.com
      - --certificatesresolvers.myresolver.acme.storage=/acme.json

networks:
  web:
    external: true
```

Initialisez le fichier qui stockera vos certificats sécurisés, puis lancez Traefik :
```bash
mkdir data
touch data/acme.json
chmod 600 data/acme.json
docker compose up -d
```

#### C. Lier le Bot/Dashboard à Traefik
Maintenant, retournez dans le dossier de votre projet **Shark-Bot**.
Vous devez modifier votre fichier `docker-compose.yml` (celui du bot) pour l'attacher au réseau de Traefik et lui ajouter les "labels" magiques qui diront à Traefik : *"Hé, je suis shark.mondomaine.com, gère mon HTTPS stp"*.

Ouvrez le `docker-compose.yml` de Shark-Bot et modifiez le service **dashboard** pour qu'il ressemble à ceci (n'oubliez pas d'ajouter le réseau `web` tout en bas du fichier) :

```yaml
  dashboard:
    build:
      context: ./dashboard
      dockerfile: Dockerfile
    depends_on:
      - bot
    # SUPPRIMEZ LES PORTS CAR TRAEFIK S'EN CHARGE
    # ports:
    #   - "80:3000"
    environment:
      API_URL: http://bot:3001
    networks:
      - shark-net
      - web # On connecte le dashboard au réseau Traefik
    restart: unless-stopped
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.shark-dashboard.rule=Host(`shark.mondomaine.com`)" # <-- REMPLACEZ PAR VOTRE DOMAINE
      - "traefik.http.routers.shark-dashboard.entrypoints=websecure"
      - "traefik.http.routers.shark-dashboard.tls.certresolver=myresolver"
      - "traefik.http.services.shark-dashboard.loadbalancer.server.port=3000"

networks:
  shark-net:
    driver: bridge
  web:
    external: true
```

Une fois cette modification faite (et vos `.env` configurés avec `https://shark.mondomaine.com`), vous pouvez lancer le projet :
```bash
docker compose up -d --build
```
Traefik détectera le dashboard, générera un certificat Let's Encrypt et rendra l'interface accessible en HTTPS !

---

## 3. Configuration Initiale

1. **Cloner le projet** sur votre serveur de production :
   ```bash
   git clone <URL_DU_REPO> shark-bot
   cd shark-bot
   ```

2. **Copier le fichier d'environnement d'exemple** :
   ```bash
   cp .env.example .env
   ```

3. **Configurer le fichier `.env`** :
   Éditez votre fichier `.env` (`nano .env`) et remplissez les valeurs avec soin :
   - `DISCORD_TOKEN` : Le Token de votre bot Discord.
   - `DISCORD_CLIENT_ID` et `DISCORD_CLIENT_SECRET` : Identifiants de votre application Discord (nécessaire pour le Dashboard).
   - `SESSION_SECRET` : Saisissez une chaîne de caractères complexe et aléatoire pour sécuriser les sessions utilisateur.
   
   **Variables d'URL (TRÈS IMPORTANT POUR LA PRODUCTION) :**
   Puisque l'application Next.js gère la communication publique via un reverse proxy (`/api`), les *URLs publiques* doivent pointer vers votre interface front-end :
   - `API_URL` : L'URL racine de votre dashboard public. Exemple : `https://shark.mondomaine.com` (Pas de `/api` à la fin, il sera ajouté automatiquement pour le callback Discord).
   - `DASHBOARD_URL` : Même chose, l'URL racine de votre dashboard. Exemple : `https://shark.mondomaine.com`.

   > [!WARNING]
   > Ne gardez pas `http://localhost:3001` ou `http://localhost:5173` dans le `.env` de production. Discord a besoin d'URLs résolvables publiquement pour procéder correctement aux redirections de connexion OAuth2.
   
   > N'oubliez pas non plus d'ajouter dans le **Discord Developer Portal** (onglet OAuth2) l'URI de redirection correspondant à : `https://shark.mondomaine.com/api/auth/discord/callback`.

---

## 3. Lancement du Déploiement

Une fois le dossier configuré, lancez les conteneurs en mode détaché avec Docker Compose :

```bash
docker compose up -d --build
```

Cette commande fera les actions suivantes :
1. Déployer et initialiser la base de données PostgreSQL.
2. Construire l'image Docker du Bot & de l'API (avec prisma generate et la compilation TypeScript).
3. Construire et lancer le Dashboard Next.js de manière optimisée pour Docker.

Le dashboard deviendra alors accessible sur le port **80** de votre machine (il est conseillé de configurer un reverse proxy comme NGINX ou Traefik avec un certificat SSL devant ce port).

---

## 4. Actions Post-Déploiement

### Déploiement des Commandes Slash (Bot Discord)
Lors du premier lancement ou lorsque vous modifiez/ajoutez des commandes slash, il est impératif d'enregistrer ces commandes auprès de l'API de Discord.
Pour ce faire, exécutez la commande suivante depuis votre machine de production :

```bash
docker compose exec bot pnpm run deploy:global
```

### Initialisation de la base de données (si applicable)
Si le bot nécessite l'application de migrations Prisma qui ne sont pas faites automatiquement au premier lancement, vous pouvez utiliser :
```bash
docker compose exec bot pnpm prisma db push
```
*(Optionnel si non requis par le pipeline d'initialisation en place).*

---

## 5. Mise à Jour (Déploiement Continu)

Lorsque vous mettez à jour le code source de l'application via `git pull`, exécutez les commandes suivantes pour re-construire et redémarrer la production, avec une interruption minimale :

```bash
# 1. Tirer les dernières modifications
git pull

# 2. Re-builder l'infrastructure en arrière-plan et redémarrer les conteneurs affectés
docker compose up -d --build

# 3. (Si des commandes Discord ont changé) 
docker compose exec bot pnpm run deploy:global
```

---

## 6. Logs & Maintenance

- **Voir les logs globaux :**
  ```bash
  docker compose logs -f
  ```
- **Voir les logs du Bot :**
  ```bash
  docker compose logs -f bot
  ```
- **Redémarrer le Bot seul :**
  ```bash
  docker compose restart bot
  ```
- **Arrêter toute l'infrastructure provisoirement :**
  ```bash
  docker compose down
  ```
