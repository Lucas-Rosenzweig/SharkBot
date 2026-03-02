import { prisma } from "./prisma";
export function getXpForNextLevel(level) {
    return 5 * (level ** 2) + 50 * level + 100;
}
/**
 * Ajoute de l'XP à un utilisateur, gère le level up et émet l'événement 'levelUp'.
 * Met à jour le cache du username/avatar Discord.
 */
export async function addXpToUser(discordId, guildId, xpAmount, client, profile) {
    const profileData = profile ? {
        ...(profile.username ? { username: profile.username } : {}),
        ...(profile.avatarHash !== undefined ? { avatarHash: profile.avatarHash } : {}),
    } : {};
    const user = await prisma.user.upsert({
        where: { discordId },
        create: { discordId, guildId, ...profileData },
        update: { ...profileData },
    });
    let xpForNextLevel = getXpForNextLevel(user.level);
    const newXpTotal = user.xpTotal + xpAmount;
    let newLevel = user.level;
    let newXpCurrent = user.xpCurrent + xpAmount;
    while (newXpCurrent >= xpForNextLevel) {
        newXpCurrent -= xpForNextLevel;
        newLevel += 1;
        xpForNextLevel = getXpForNextLevel(newLevel);
        client.emit('levelUp', user, newLevel);
    }
    await prisma.user.update({
        where: { discordId },
        data: {
            level: newLevel,
            xpTotal: newXpTotal,
            xpCurrent: newXpCurrent,
            xpNext: getXpForNextLevel(newLevel),
        },
    });
}
