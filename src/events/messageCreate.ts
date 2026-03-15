import { Message } from "discord.js";
import { prisma } from "../utils/prisma";
import { ConfigService } from "../services/ConfigService";
import { addXpToUser } from "../utils/addXpToUser";
import { createLogger } from "../utils/logger";

const logger = createLogger('MessageCreate');

export const name = 'messageCreate';

export async function execute(message: Message) {
    if (message.author.bot) return; // Skip bot messages
    if (!message.guild) return; // Skip DMs

    try {
        const configService = ConfigService.getInstance();
        const guildConfig = await configService.getConfigForGuild(message.guild.id);

        const profile = {
            username: message.author.displayName,
            avatarHash: message.author.avatar,
        };

        const user = await prisma.user.upsert({
            where: { guildId_discordId: { guildId: message.guild.id, discordId: message.author.id } },
            create: { discordId: message.author.id, guildId: message.guild.id, ...profile },
            update: { ...profile },
        });

        const now = Date.now();
        const cooldownMs = guildConfig.xpCooldown * 1000;
        const lastMessageTime = user.lastMessage ? user.lastMessage.getTime() : 0;

        //Maintenant on met a jour l'xp de l'utilisateur si son dernier message date de plus de 20 secondes
        if (!user.lastMessage || (now - lastMessageTime) >= cooldownMs) {
            await addXpToUser(message.author.id, message.guild.id, guildConfig.xpPerMessage, message.client, profile);

            // Mise à jour du timestamp du dernier message
            await prisma.user.update({
                where: { guildId_discordId: { guildId: message.guild.id, discordId: message.author.id } },
                data: { lastMessage: new Date(now) },
            });

            logger.debug(
                { user: message.author.tag, discordId: message.author.id, xp: guildConfig.xpPerMessage },
                'Updated XP for user',
            );
        }
    } catch (error) {
        logger.error({ error, guildId: message.guild?.id }, 'Error processing message');
    }
}