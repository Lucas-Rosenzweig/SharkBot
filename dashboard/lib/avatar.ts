import type { AuthUser } from './types';

/**
 * Compute the Discord avatar URL for a user.
 * Handles custom avatars, pomelo (new username system), and legacy discriminators.
 */
export function getDiscordAvatarUrl(user: AuthUser, size = 64): string {
    if (user.avatar) {
        return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=${size}`;
    }

    const isPomelo = user.discriminator === '0' || user.discriminator === '0000';
    if (isPomelo) {
        const defaultAvatarIndex = Number((BigInt(user.id) >> 22n) % 6n);
        return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
    }

    const defaultAvatarIndex = Number(user.discriminator) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
}

