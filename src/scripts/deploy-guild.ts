import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { collectCommandData } from './collectCommands';

config();

const commands = collectCommandData();
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);
const guildId = process.env.GUILD_ID;

if (!guildId) {
    console.error('❌ GUILD_ID non défini dans le fichier .env');
    process.exit(1);
}

(async () => {
    try {
        console.log(`🏰 Déploiement de ${commands.length} commande(s)/context menu(s) sur la guild ${guildId}...`);

        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_APP_ID!, guildId),
            { body: commands },
        ) as any[];

        console.log(`✅ ${data.length} commande(s)/context menu(s) déployé(s) sur la guild (instantané).`);
    } catch (error) {
        console.error('❌ Erreur lors du déploiement sur la guild:', error);
        process.exit(1);
    }
})();