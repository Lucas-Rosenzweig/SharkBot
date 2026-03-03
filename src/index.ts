import 'dotenv/config';
import { prisma } from './utils/prisma';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadCommands } from './utils/loadCommands';
import { loadEvents } from './utils/loadEvents';
import { loadContextMenus } from './utils/loadContextMenus';
import { ReactionMapService } from './services/ReactionMapService';
import { upsertGuilds } from './utils/upsertGuilds';
import { setupReactionMapListeners } from './listeners/reactionMapListeners';
import { setupLevelUpListeners } from './listeners/levelUpListeners';
import { startApiServer } from './api/server';
import { createLogger } from './utils/logger';
import './type/discord';

const logger = createLogger('Main');

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

const reactionMapState = ReactionMapService.getInstance();
setupReactionMapListeners();
setupLevelUpListeners(client);

async function main() {
    await client.login(process.env.DISCORD_TOKEN);
    await reactionMapState.load();
    await upsertGuilds(client);
    startApiServer(client);
}

main().catch(async (err) => {
    logger.fatal({ err }, 'Startup error');
    await prisma.$disconnect();
    process.exit(1);
});

process.on('SIGINT', async () => {
    logger.info('Received SIGINT, shutting down');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM, shutting down');
    await prisma.$disconnect();
    process.exit(0);
});
