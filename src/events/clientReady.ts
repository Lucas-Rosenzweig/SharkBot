import { Client } from 'discord.js';
import { VoiceXpService } from '../services/VoiceXpService';

export const name = 'clientReady';
export const once = true;
export async function execute(client: Client) {
  console.log(`Bot connecté en tant que ${client.user?.tag}`);

  // Initialiser le tracking vocal XP pour les utilisateurs déjà en vocal
  const voiceXpService = VoiceXpService.getInstance();
  await voiceXpService.initializeFromGuilds(client);
}

