import EventEmitter from "node:events";
import { prisma } from "../utils/prisma";
import { createLogger } from "../utils/logger";
import type { ReactionMapRecord } from "../type/ReactionMapRecord";
export type { ReactionMapRecord } from "../type/ReactionMapRecord";

const logger = createLogger('ReactionMap');

export class ReactionMapService extends EventEmitter {
    private store: Map<string, Map<string, ReactionMapRecord>> = new Map();
    private static instance: ReactionMapService | null = null;

    private constructor() {
        super();
    }

    static getInstance(): ReactionMapService {
        if (!ReactionMapService.instance) {
            ReactionMapService.instance = new ReactionMapService();
        }
        return ReactionMapService.instance;
    }

    async load(): Promise<void> {
        this.store.clear();

        const guilds = await prisma.guild.findMany({
            include: { reactionMaps: true },
        });

        for (const guild of guilds) {
            const guildMap = new Map<string, ReactionMapRecord>();
            for (const rm of guild.reactionMaps) {
                guildMap.set(rm.id, {
                    id: rm.id,
                    guildId: rm.guildId,
                    messageId: rm.messageId,
                    emoji: rm.emoji,
                    roleId: rm.roleId,
                    removeOnUnreact: rm.removeOnUnreact,
                });
            }
            this.store.set(guild.id, guildMap);
        }

        logger.info({ guilds: guilds.length }, 'Reaction maps loaded');
        this.emit('loaded-reaction-maps');
    }

    getReactionMapsForGuild(guildId: string): ReactionMapRecord[] {
        return Array.from(this.store.get(guildId)?.values() ?? []);
    }

    getRoleForReaction(guildId: string, messageId: string, emoji: string): ReactionMapRecord | null {
        const guildMap = this.store.get(guildId);
        if (!guildMap) return null;

        logger.debug({ guildId, messageId, emoji }, 'Looking up reaction mapping');

        for (const rm of guildMap.values()) {
            if (rm.messageId === messageId && rm.emoji === emoji) {
                return rm;
            }
        }
        return null;
    }

    getStore(): ReadonlyMap<string, ReadonlyMap<string, ReactionMapRecord>> {
        return this.store;
    }

    async addReactionMap(guildId: string, reactionMap: Omit<ReactionMapRecord, 'id'>): Promise<ReactionMapRecord> {
        let guildMap = this.store.get(guildId);
        if (!guildMap) {
            guildMap = new Map<string, ReactionMapRecord>();
            this.store.set(guildId, guildMap);
        }

        const createdRecord = await prisma.reactionMap.create({
            data: {
                guildId: reactionMap.guildId,
                messageId: reactionMap.messageId,
                emoji: reactionMap.emoji,
                roleId: reactionMap.roleId,
                removeOnUnreact: reactionMap.removeOnUnreact,
            },
        });

        const record: ReactionMapRecord = {
            id: createdRecord.id,
            guildId: createdRecord.guildId,
            messageId: createdRecord.messageId,
            emoji: createdRecord.emoji,
            roleId: createdRecord.roleId,
            removeOnUnreact: createdRecord.removeOnUnreact,
        };

        guildMap.set(record.id, record);
        this.emit('reaction-map-added');
        logger.info({ guildId, emoji: record.emoji, roleId: record.roleId }, 'Reaction map added');

        return record;
    }
}
