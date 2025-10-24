import { Interaction, ContextMenuCommandInteraction, ChatInputCommandInteraction } from 'discord.js';
import { client } from '../index';

export const name = 'interactionCreate';
export async function execute(interaction: Interaction) {
  // Traitement des Commandes slash
  if (interaction.isChatInputCommand()) {
    const command = (client as any).commands?.get((interaction as ChatInputCommandInteraction).commandName);
    if (!command) return;
    try {
      await command.execute(interaction as ChatInputCommandInteraction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
      }
    }
    return;
  }

  if (interaction.isContextMenuCommand()) {
    console.log('Context Menu Command detected');
    const command = (client as any).contextMenus?.get((interaction as ContextMenuCommandInteraction).commandName);
    if (!command) return;
    try {
      await command.execute(interaction as ContextMenuCommandInteraction);
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
      }
    }
    return;
  }

}
