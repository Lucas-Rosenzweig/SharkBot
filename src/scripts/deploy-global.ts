import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { collectCommandData } from './collectCommands';

config();

const commands = collectCommandData();
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log(`🌍 Déploiement de ${commands.length} commande(s)/context menu(s) en global...`);
        console.log('⚠️  Note: La propagation peut prendre jusqu\'à 1 heure.');

        const data = await rest.put(
            Routes.applicationCommands(process.env.DISCORD_APP_ID!),
            { body: commands },
        ) as any[];

        console.log(`✅ ${data.length} commande(s)/context menu(s) déployé(s) en global.`);
    } catch (error) {
        console.error('❌ Erreur lors du déploiement global des commandes:', error);
        process.exit(1);
    }
})();
