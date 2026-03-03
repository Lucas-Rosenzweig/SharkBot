'use client';

import { useEffect, useRef, useCallback } from 'react';

// ── Event types matching backend EventBus ────────────────────

export type GuildEventType =
    | 'connected'
    | 'xp:update'
    | 'level:up'
    | 'config:update'
    | 'level-roles:create'
    | 'level-roles:delete'
    | 'reaction-roles:create'
    | 'reaction-roles:delete'
    | 'user:update';

export interface GuildEvent<T = unknown> {
    type: GuildEventType;
    guildId: string;
    data: T;
    timestamp: number;
}

type GuildEventHandler = (event: GuildEvent) => void;

interface UseGuildEventsOptions {
    /** The guild ID to subscribe to */
    guildId: string;
    /** Event handlers map: event type → callback */
    onEvent?: Partial<Record<GuildEventType, GuildEventHandler>>;
    /** Global handler called for every event */
    onAnyEvent?: GuildEventHandler;
    /** Whether the connection is enabled (default: true) */
    enabled?: boolean;
}

/**
 * Hook to subscribe to real-time SSE events for a guild.
 *
 * Uses EventSource to connect to `/api/guilds/:guildId/events`.
 * Automatically reconnects on connection loss.
 *
 * @example
 * ```tsx
 * useGuildEvents({
 *   guildId,
 *   onEvent: {
 *     'config:update': (event) => setConfig(event.data),
 *     'xp:update': (event) => updateLeaderboard(event.data),
 *   },
 * });
 * ```
 */
export function useGuildEvents({ guildId, onEvent, onAnyEvent, enabled = true }: UseGuildEventsOptions) {
    // Use refs to avoid re-creating the EventSource when handlers change
    const onEventRef = useRef(onEvent);
    const onAnyEventRef = useRef(onAnyEvent);

    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    useEffect(() => {
        onAnyEventRef.current = onAnyEvent;
    }, [onAnyEvent]);

    const handleEvent = useCallback((eventType: GuildEventType, rawData: string) => {
        try {
            const event: GuildEvent = JSON.parse(rawData);
            onEventRef.current?.[eventType]?.(event);
            onAnyEventRef.current?.(event);
        } catch {
            // Ignore malformed events
        }
    }, []);

    useEffect(() => {
        if (!enabled || !guildId) return;

        const url = `/api/guilds/${guildId}/events`;
        let eventSource: EventSource;
        let reconnectTimeout: ReturnType<typeof setTimeout>;
        let isCleanedUp = false;

        const eventTypes: GuildEventType[] = [
            'connected',
            'xp:update',
            'level:up',
            'config:update',
            'level-roles:create',
            'level-roles:delete',
            'reaction-roles:create',
            'reaction-roles:delete',
            'user:update',
        ];

        const connect = () => {
            if (isCleanedUp) return;

            eventSource = new EventSource(url, { withCredentials: true });

            // Register a listener for each named event type
            for (const type of eventTypes) {
                eventSource.addEventListener(type, (e: MessageEvent) => {
                    handleEvent(type, e.data);
                });
            }

            eventSource.onerror = () => {
                eventSource.close();
                if (!isCleanedUp) {
                    // Reconnect after 3 seconds
                    reconnectTimeout = setTimeout(connect, 3_000);
                }
            };
        };

        connect();

        return () => {
            isCleanedUp = true;
            clearTimeout(reconnectTimeout);
            eventSource?.close();
        };
    }, [guildId, enabled, handleEvent]);
}

