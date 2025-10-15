import 'dotenv/config';
import { prisma } from './utils/prisma';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadCommands } from './utils/loadCommands';
import { loadEvents } from './utils/loadEvents';
import { loadContextMenus } from './utils/loadContextMenus';

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Message, Partials.Reaction, Partials.Channel, Partials.User],
});

// Load commands, context menus, and events
loadCommands(client);
loadContextMenus(client);
loadEvents(client);

client.login(process.env.DISCORD_TOKEN);

// Gracefully disconnect Prisma on process termination
process.on('SIGINT',  async () => { await prisma.$disconnect(); process.exit(0); });
process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });
