import { client } from '../index';
export const name = 'interactionCreate';
export async function execute(interaction) {
    // Traitement des Commandes slash
    if (interaction.isChatInputCommand()) {
        const command = client.commands?.get(interaction.commandName);
        if (!command)
            return;
        try {
            await command.execute(interaction);
        }
        catch (error) {
            console.error(error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
            }
        }
        return;
    }
    if (interaction.isContextMenuCommand()) {
        console.log('Context Menu Command detected');
        const command = client.contextMenus?.get(interaction.commandName);
        if (!command)
            return;
        try {
            await command.execute(interaction);
        }
        catch (error) {
            console.error(error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
            }
        }
        return;
    }
}
