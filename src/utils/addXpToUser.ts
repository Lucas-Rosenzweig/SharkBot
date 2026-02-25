import { Client } from "discord.js";
import { prisma } from "./prisma";

export function getXpForNextLevel(level: number): number {
    return 5 * (level ** 2) + 50 * level + 100;
}

/**
 * Ajoute de l'XP à un utilisateur, gère le level up et émet l'événement 'levelUp'.
 */
export async function addXpToUser(discordId: string, guildId: string, xpAmount: number, client: Client): Promise<void> {
    const user = await prisma.user.upsert({
        where: { discordId },
        create: { discordId, guildId },
        update: {},
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

