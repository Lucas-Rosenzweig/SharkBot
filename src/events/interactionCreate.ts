import { Interaction } from 'discord.js';
import { createLogger } from '../utils/logger';
import '../type/discord';

const logger = createLogger('InteractionCreate');

export const name = 'interactionCreate';

export async function execute(interaction: Interaction) {
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands?.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error({ error, command: interaction.commandName }, 'Command execution failed');
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
            }
        }
        return;
    }

    if (interaction.isContextMenuCommand()) {
        const command = interaction.client.contextMenus?.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error({ error, command: interaction.commandName }, 'Context menu execution failed');
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
            }
        }
        return;
    }
}
