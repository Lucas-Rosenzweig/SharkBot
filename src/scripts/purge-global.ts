import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';

config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
    try {
        console.log('🗑️ Suppression de toutes les commandes globales...');
        const existing = await rest.get(
            Routes.applicationCommands(process.env.DISCORD_APP_ID!)
        ) as any[];

        for (const cmd of existing) {
            await rest.delete(
                Routes.applicationCommand(process.env.DISCORD_APP_ID!, cmd.id)
            );
            console.log(`   ✓ Supprimé: ${cmd.name}`);
        }

        console.log(`✅ ${existing.length} commande(s)/context menu(s) global(aux) supprimé(s).`);
    } catch (error) {
        console.error('❌ Erreur lors de la suppression des commandes globales:', error);
        process.exit(1);
    }
})();

