import { prisma } from "./prisma";
import { Client } from "discord.js";
import { createLogger } from "./logger";

const logger = createLogger('UpsertGuilds');

// Upsert all guilds the bot is in to the database
export async function upsertGuilds(client: Client) {
    const guilds = await client.guilds.fetch();
    for (const [guildId, guild] of guilds) {
        await prisma.guild.upsert({
            where: { id: guildId },
            update: { name: guild.name },
            create: { id: guildId, name: guild.name },
        });
        logger.info({ guildId, name: guild.name }, 'Guild upserted');
    }
}