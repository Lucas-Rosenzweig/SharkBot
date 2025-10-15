import {Interaction, MessageFlags} from 'discord.js';
import { client } from '../index';

export const name = 'interactionCreate';
export async function execute(interaction: Interaction) {
  // Traitement des Commandes slash
  if (interaction.isChatInputCommand()) {
    // @ts-ignore
    const command = client.commands?.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Une erreur est survenue.', flags: MessageFlags.Ephemeral });
    }
    return;
  }

  // Traitement des Menus contextuels (message et utilisateur)
  if (interaction.isMessageContextMenuCommand() || interaction.isUserContextMenuCommand()) {
    // @ts-ignore
    const contextMenu = client.contextMenus?.get(interaction.commandName);
    if (!contextMenu) return;
    try {
      await contextMenu.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'Une erreur est survenue.', flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: 'Une erreur est survenue.', flags: MessageFlags.Ephemeral });
      }
    }
  }
}
