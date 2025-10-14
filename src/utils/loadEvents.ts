import { Client } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

export function loadEvents(client: Client) {
  const eventsPath = join(__dirname, '../events');
  const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
  for (const file of eventFiles) {
    const event = require(join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
}

