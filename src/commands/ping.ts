import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Répond avec Pong!');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.reply('Pong!');
}

