// ── Shared types used across the dashboard ──────────────────

export const DEFAULT_LEVEL_UP_MESSAGE =
    '🎉 {mention} a atteint le niveau {level} ! Félicitations !';

export interface AuthUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
}

export interface AuthResponse {
    authenticated: boolean;
    user?: AuthUser;
}

export interface Guild {
    id: string;
    name: string;
    icon: string | null;
}

export interface Channel {
    id: string;
    name: string;
}

export interface Role {
    id: string;
    name: string;
    color: string;
}

export interface Config {
    xpCooldown: number;
    xpPerMessage: number;
    xpPerMinute: number;
    xpChannelId?: string;
    voiceXpRequireUnmuted: boolean;
    levelUpMessage?: string | null;
}

export interface UserData {
    id: number;
    discordId: string;
    guildId: string;
    username: string | null;
    avatarHash: string | null;
    xpTotal: number;
    xpCurrent: number;
    xpNext: number;
    level: number;
}

export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface UsersResponse {
    users: UserData[];
    pagination: Pagination;
}

export interface LevelRole {
    id: string;
    guildId: string;
    roleId: string;
    levelReq: number;
}

export interface ReactionRole {
    id: string;
    guildId: string;
    messageId: string;
    emoji: string;
    roleId: string;
    removeOnUnreact: boolean;
}

export interface CustomEmoji {
    id: string;
    name: string;
    url: string;
    animated: boolean;
    formatted: string;
}

export interface ChannelMessage {
    id: string;
    content: string;
    author: {
        username: string;
        avatar: string | null;
    };
    timestamp: number;
}


