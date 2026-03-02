import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';
config();
const commands = [];
const commandsPath = join(__dirname, '../commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(join(commandsPath, file));
    commands.push(command.data.toJSON());
}
const contextMenusPath = join(__dirname, '../contextMenus');
const contextMenuFiles = readdirSync(contextMenusPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
for (const file of contextMenuFiles) {
    const menu = require(join(contextMenusPath, file));
    commands.push(menu.data.toJSON());
}
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const guildId = process.env.GUILD_ID;
if (!guildId) {
    console.error('❌ GUILD_ID non défini dans le fichier .env');
    process.exit(1);
}
(async () => {
    try {
        console.log(`🏰 Déploiement de ${commands.length} commande(s)/context menu(s) sur la guild ${guildId}...`);
        const data = await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_APP_ID, guildId), { body: commands });
        console.log(`✅ ${data.length} commande(s)/context menu(s) déployé(s) sur la guild (instantané).`);
    }
    catch (error) {
        console.error('❌ Erreur lors du déploiement sur la guild:', error);
        process.exit(1);
    }
})();
