import { ContextMenuCommandBuilder, ApplicationCommandType, MessageContextMenuCommandInteraction, MessageFlags } from 'discord.js';

export const data = new ContextMenuCommandBuilder()
    .setName('Créer reaction-role')
    .setType(ApplicationCommandType.Message);

export async function execute(interaction: MessageContextMenuCommandInteraction) {
    await interaction.reply({ content: 'Commande en cours de développement.',   flags: MessageFlags.Ephemeral});
}
