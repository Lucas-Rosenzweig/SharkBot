import { Interaction } from 'discord.js';
import { client } from '../index';

export const name = 'interactionCreate';
export async function execute(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands?.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
  }
}

