import { Client } from 'discord.js';

export const name = 'clientReady';
export const once = true;
export function execute(client: Client) {
  console.log(`Bot connecté en tant que ${client.user?.tag}`);
}

