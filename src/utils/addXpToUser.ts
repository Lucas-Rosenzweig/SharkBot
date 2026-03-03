import { Client } from "discord.js";
import { prisma } from "./prisma";
import { eventBus } from "../services/EventBus";

export function getXpForNextLevel(level: number): number {
    return 5 * (level ** 2) + 50 * level + 100;
}

/**
 * Ajoute de l'XP à un utilisateur, gère le level up et émet l'événement 'levelUp'.
 * Met à jour le cache du username/avatar Discord.
 */
export async function addXpToUser(
    discordId: string,
    guildId: string,
    xpAmount: number,
    client: Client,
    profile?: { username?: string; avatarHash?: string | null },
): Promise<void> {
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

        // Emit level:up event for SSE
        eventBus.emitGuildEvent('level:up', guildId, {
            discordId,
            guildId,
            newLevel,
            username: profile?.username ?? user.username,
        });
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

    // Emit xp:update event for SSE
    eventBus.emitGuildEvent('xp:update', guildId, {
        discordId,
        guildId,
        xpTotal: newXpTotal,
        xpCurrent: newXpCurrent,
        xpNext: getXpForNextLevel(newLevel),
        level: newLevel,
        username: profile?.username ?? user.username,
    });
}

