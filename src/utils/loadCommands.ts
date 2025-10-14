import { Collection, Client } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

export function loadCommands(client: Client) {
  const commands = new Collection();
  const commandsPath = join(__dirname, '../commands');
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(join(commandsPath, file));
    commands.set(command.data.name, command);
  }
  // @ts-ignore
  client.commands = commands;
}
