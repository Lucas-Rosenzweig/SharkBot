import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadCommands } from './utils/loadCommands';
import { loadEvents } from './utils/loadEvents';

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
loadEvents(client);

client.login(process.env.DISCORD_TOKEN);
