import {prisma} from "./prisma";
import {Client} from "discord.js";

export async function upsertGuilds(client: Client) {
    const guilds = await client.guilds.fetch();
    for (const [guildId, guild] of guilds) {
        await prisma.guild.upsert({
            where: { id: guildId },
            update: { name: guild.name },
            create: { id: guildId, name: guild.name },
        });
        console.log(`Guild upserted: ${guild.name} (${guildId})`);
    }
}