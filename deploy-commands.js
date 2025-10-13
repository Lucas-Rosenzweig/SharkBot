require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
// Récupère tous les fichiers de commandes du dossier commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Récupère le SlashCommandBuilder#toJSON() de chaque commande pour le déploiement
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[ATTENTION] La commande ${filePath} ne possède pas les propriétés "data" ou "execute" requises.`);
    }
}

// Construit et prépare une instance du module REST
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Déploie les commandes
(async () => {
    try {
        console.log(`Démarrage du rafraîchissement de ${commands.length} commande(s) slash (/).`);

        // La méthode put est utilisée pour rafraîchir entièrement toutes les commandes dans le serveur avec l'ensemble actuel
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log(`✅ Rechargement réussi de ${data.length} commande(s) slash (/).`);
    } catch (error) {
        // Et bien sûr, assurez-vous de gérer les erreurs!
        console.error(error);
    }
})();
