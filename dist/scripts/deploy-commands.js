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
(async () => {
    try {
        console.log('🔧 Déploiement intelligent des commandes/context menus...\n');
        // Purge globale
        console.log('🗑️  Purge des commandes globales...');
        const globalExisting = await rest.get(Routes.applicationCommands(process.env.DISCORD_APP_ID));
        for (const cmd of globalExisting) {
            await rest.delete(Routes.applicationCommand(process.env.DISCORD_APP_ID, cmd.id));
        }
        console.log(`   ✓ ${globalExisting.length} commande(s) globale(s) supprimée(s)\n`);
        if (guildId) {
            // Purge guild
            console.log(`🗑️  Purge des commandes sur la guild ${guildId}...`);
            const guildExisting = await rest.get(Routes.applicationGuildCommands(process.env.DISCORD_APP_ID, guildId));
            for (const cmd of guildExisting) {
                await rest.delete(Routes.applicationGuildCommand(process.env.DISCORD_APP_ID, guildId, cmd.id));
            }
            console.log(`   ✓ ${guildExisting.length} commande(s) de guild supprimée(s)\n`);
            // Déploiement sur la guild
            console.log(`🏰 Déploiement de ${commands.length} commande(s)/context menu(s) sur la guild...`);
            const data = await rest.put(Routes.applicationGuildCommands(process.env.DISCORD_APP_ID, guildId), { body: commands });
            console.log(`✅ ${data.length} commande(s)/context menu(s) déployé(s) sur la guild (instantané).`);
        }
        else {
            // Déploiement global
            console.log(`🌍 Déploiement de ${commands.length} commande(s)/context menu(s) en global...`);
            const data = await rest.put(Routes.applicationCommands(process.env.DISCORD_APP_ID), { body: commands });
            console.log(`✅ ${data.length} commande(s)/context menu(s) déployé(s) en global.`);
            console.log('⚠️  Note: La propagation peut prendre jusqu\'à 1 heure.');
        }
    }
    catch (error) {
        console.error('❌ Erreur lors du déploiement:', error);
        process.exit(1);
    }
})();
