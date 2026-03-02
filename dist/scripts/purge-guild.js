import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
config();
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const guildId = process.env.GUILD_ID;
if (!guildId) {
    console.error('❌ GUILD_ID non défini dans le fichier .env');
    process.exit(1);
}
(async () => {
    try {
        console.log(`🗑️ Suppression de toutes les commandes sur la guild ${guildId}...`);
        const existing = await rest.get(Routes.applicationGuildCommands(process.env.DISCORD_APP_ID, guildId));
        for (const cmd of existing) {
            await rest.delete(Routes.applicationGuildCommand(process.env.DISCORD_APP_ID, guildId, cmd.id));
            console.log(`   ✓ Supprimé: ${cmd.name}`);
        }
        console.log(`✅ ${existing.length} commande(s)/context menu(s) supprimé(s) sur la guild.`);
    }
    catch (error) {
        console.error('❌ Erreur lors de la suppression des commandes de la guild:', error);
        process.exit(1);
    }
})();
