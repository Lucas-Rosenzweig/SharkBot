import { prisma } from "../utils/prisma";
import { ConfigService } from "../services/ConfigService";
import { addXpToUser, getXpForNextLevel } from "../utils/addXpToUser";
export const name = 'messageCreate';
export async function execute(message) {
    if (message.author.bot)
        return; // Skip bot messages
    if (!message.guild)
        return; // Skip DMs
    const configService = ConfigService.getInstance();
    const guildConfig = await configService.getConfigForGuild(message.guild.id);
    const profile = {
        username: message.author.displayName,
        avatarHash: message.author.avatar,
    };
    const user = await prisma.user.upsert({
        where: { discordId: message.author.id },
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
            where: { discordId: message.author.id },
            data: { lastMessage: new Date(now) },
        });
        // Recharger l'utilisateur pour le log
        const updatedUser = await prisma.user.findUnique({ where: { discordId: message.author.id } });
        if (updatedUser) {
            console.log(`Updated XP for user ${message.author.tag} (${message.author.id}): Level ${updatedUser.level}, XP ${updatedUser.xpCurrent}/${getXpForNextLevel(updatedUser.level)}`);
        }
    }
}
