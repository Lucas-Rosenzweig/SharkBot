import { EventEmitter } from 'events';
import { createLogger } from '../utils/logger';

const logger = createLogger('EventBus');

// ── Event types ──────────────────────────────────────────────

export interface GuildEvent {
    type: GuildEventType;
    guildId: string;
    data: unknown;
    timestamp: number;
}

export type GuildEventType =
    | 'xp:update'
    | 'level:up'
    | 'config:update'
    | 'level-roles:create'
    | 'level-roles:delete'
    | 'reaction-roles:create'
    | 'reaction-roles:delete'
    | 'user:update';

export interface XpUpdateEventData {
    discordId: string;
    guildId: string;
    xpTotal: number;
    xpCurrent: number;
    xpNext: number;
    level: number;
    username?: string | null;
}

export interface LevelUpEventData {
    discordId: string;
    guildId: string;
    newLevel: number;
    username?: string | null;
}

export interface ConfigUpdateEventData {
    xpCooldown: number;
    xpPerMessage: number;
    xpPerMinute: number;
    xpChannelId?: string;
    voiceXpRequireUnmuted: boolean;
    levelUpMessage?: string | null;
}

export interface LevelRoleEventData {
    id: string;
    guildId: string;
    roleId: string;
    levelReq: number;
}

export interface ReactionRoleEventData {
    id?: string;
    guildId: string;
    messageId: string;
    emoji: string;
    roleId: string;
}

export interface UserUpdateEventData {
    discordId: string;
    guildId: string;
    level: number;
    xpTotal: number;
    xpCurrent: number;
    xpNext: number;
    username?: string | null;
}

// ── EventBus singleton ──────────────────────────────────────

class EventBus extends EventEmitter {
    private static instance: EventBus;

    private constructor() {
        super();
        this.setMaxListeners(100); // Support many concurrent SSE connections
    }

    static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    /**
     * Emit a typed event scoped to a guild
     */
    emitGuildEvent(type: GuildEventType, guildId: string, data: unknown): void {
        const event: GuildEvent = {
            type,
            guildId,
            data,
            timestamp: Date.now(),
        };
        this.emit(`guild:${guildId}`, event);
        logger.debug({ type, guildId }, 'Guild event emitted');
    }

    /**
     * Subscribe to all events for a specific guild
     */
    onGuildEvent(guildId: string, listener: (event: GuildEvent) => void): void {
        this.on(`guild:${guildId}`, listener);
    }

    /**
     * Unsubscribe from guild events
     */
    offGuildEvent(guildId: string, listener: (event: GuildEvent) => void): void {
        this.off(`guild:${guildId}`, listener);
    }
}

export const eventBus = EventBus.getInstance();

