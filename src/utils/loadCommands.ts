import { Collection, Client } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import type { BotCommand } from '../type/discord';

export function loadCommands(client: Client) {
    client.commands = new Collection<string, BotCommand>();
    const commandsPath = join(__dirname, '../commands');
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(join(commandsPath, file));
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    }
}
