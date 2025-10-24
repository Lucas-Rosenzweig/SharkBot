// typescript
import 'dotenv/config';
import { prisma } from './utils/prisma';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadCommands } from './utils/loadCommands';
import { loadEvents } from './utils/loadEvents';
import { loadContextMenus } from './utils/loadContextMenus';
import { ReactionMapState } from './state/reactionMapState';
import {upsertGuilds} from "./utils/upsertGuilds";

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

loadCommands(client);
loadContextMenus(client);
loadEvents(client);

const reactionMapState = ReactionMapState.getInstance();

async function main() {
    await reactionMapState.load();
    console.log(
        'ReactionMapState loaded with',
        reactionMapState.listenerCount('loaded'),
        'listeners'
    );

    await reactionMapState.load(); // Load reaction maps from the database
    await client.login(process.env.DISCORD_TOKEN);
    await upsertGuilds(client); // On est obligé d'attendre que le client soit prêt avant d'appeler cette fonction
}

main().catch(async (err) => {
    console.error('Startup error', err);
    await prisma.$disconnect();
    process.exit(1);
});

// Gracefully disconnect Prisma on process termination
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
