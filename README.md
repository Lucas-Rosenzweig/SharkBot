# Shark Bot 🦈

Un bot Discord construit avec discord.js v14

## Structure du projet

```
shark-bot/
├── commands/          # Dossier contenant toutes les commandes slash
│   ├── ping.js       # Commande ping
│   ├── user.js       # Commande d'info utilisateur
│   └── server.js     # Commande d'info serveur
├── events/           # Dossier contenant tous les événements
│   ├── ready.js      # Événement quand le bot est prêt
│   └── interactionCreate.js  # Gestion des interactions
├── index.js          # Point d'entrée principal du bot
├── deploy-commands.js  # Script pour déployer les commandes sur Discord
├── package.json
└── .env.example      # Exemple de fichier de configuration

```

## Installation

1. Clonez le dépôt
2. Installez les dépendances :
```bash
npm install
```

3. Créez un fichier `.env` à partir de `.env.example` :
```bash
cp .env.example .env
```

4. Remplissez les variables d'environnement dans le fichier `.env` :
   - `DISCORD_TOKEN` : Le token de votre bot Discord
   - `CLIENT_ID` : L'ID de votre application Discord
   - `GUILD_ID` : L'ID du serveur Discord où déployer les commandes

## Comment obtenir les tokens

1. **DISCORD_TOKEN** : Allez sur le [Discord Developer Portal](https://discord.com/developers/applications), sélectionnez votre application, allez dans "Bot" et copiez le token
2. **CLIENT_ID** : Dans le Developer Portal, sous "General Information", copiez l'Application ID
3. **GUILD_ID** : Dans Discord, activez le mode développeur (Paramètres > Avancé > Mode développeur), puis faites un clic droit sur votre serveur et "Copier l'identifiant du serveur"

## Utilisation

### Déployer les commandes sur Discord
Avant de démarrer le bot pour la première fois, vous devez déployer les commandes :
```bash
npm run deploy
```

### Démarrer le bot
```bash
npm start
```

## Ajouter de nouvelles commandes

1. Créez un nouveau fichier dans le dossier `commands/` (ex: `macommande.js`)
2. Utilisez ce template :

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('macommande')
        .setDescription('Description de ma commande'),
    async execute(interaction) {
        await interaction.reply('Réponse de ma commande!');
    },
};
```

3. Redéployez les commandes :
```bash
npm run deploy
```

## Ajouter de nouveaux événements

1. Créez un nouveau fichier dans le dossier `events/` (ex: `monevent.js`)
2. Utilisez ce template :

```javascript
const { Events } = require('discord.js');

module.exports = {
    name: Events.NomDeLEvenement,
    once: false, // true si l'événement ne doit se déclencher qu'une fois
    execute(arg1, arg2) {
        // Votre code ici
    },
};
```

Le bot chargera automatiquement tous les fichiers de commandes et d'événements au démarrage.

## Commandes disponibles

- `/ping` - Répond avec "Pong!"
- `/user` - Affiche les informations sur l'utilisateur
- `/server` - Affiche les informations sur le serveur

## Licence

ISC

