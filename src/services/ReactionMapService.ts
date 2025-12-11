import EventEmitter from "node:events";
import { prisma } from "../utils/prisma";
import {ReactionMapRecord} from "../type/ReactionMapRecord";


export class ReactionMapService extends EventEmitter {
    private store: Map<string, Map<string, ReactionMapRecord>> = new Map();
    private static instance: ReactionMapService | null = null;

    private constructor() { //Constructeur privé car singleton
        super();
    }

    // Singleton instance accessor
    static getInstance(): ReactionMapService {
        if (!ReactionMapService.instance) {
            ReactionMapService.instance = new ReactionMapService();
        }
        return ReactionMapService.instance;
    }

    //Load all reaction maps from the database
    async load(): Promise<void> {
        //Clear the store
        this.store.clear();

        //Load all guilds with their reaction maps
        const guilds = await prisma.guild.findMany({
            include: {
                reactionMaps: true,
            },
        });

        // Populate the store
        for (const guild of guilds) {
            const guildMap = new Map<string, ReactionMapRecord>();
            for (const reactionMap of guild.reactionMaps) {
                guildMap.set(reactionMap.id, {
                    id: reactionMap.id,
                    guildId: reactionMap.guildId,
                    messageId: reactionMap.messageId,
                    emoji: reactionMap.emoji,
                    roleId: reactionMap.roleId,
                    removeOnUnreact: reactionMap.removeOnUnreact,
                });
            }
            this.store.set(guild.id, guildMap);
        }
        this.emit('loaded-reaction-maps');
    }

     getReactionMapsForGuild(guildId: string): ReactionMapRecord[] {
        const guildMap = this.store.get(guildId);
        if (!guildMap) {
            return [];
        }
        return Array.from(guildMap.values());
    }

    async getRoleForReaction(guildId: string, messageId: string, emoji: string): Promise<ReactionMapRecord | null> {
        const guildMap = this.store.get(guildId);
        if (!guildMap) {
            return null;
        }
        console.log(`Recherche de mapping pour guildId=${guildId}, messageId=${messageId}, emoji=${emoji}`);
        for (const reactionMap of guildMap.values()) {
            if (reactionMap.messageId === messageId && reactionMap.emoji === emoji) {
                return reactionMap;
            }
        }
        return null;
    }

    async getStore(): Promise<Map<string, Map<string, ReactionMapRecord>>> {
        return this.store
    }

    async addReactionMap(guildId: string, reactionMap: ReactionMapRecord) {
        let guildMap = this.store.get(guildId);
        if (!guildMap) {
            guildMap = new Map<string, ReactionMapRecord>();
            this.store.set(guildId, guildMap);
        }
        guildMap.set(reactionMap.id, reactionMap);

        // Also persist to the database
        await prisma.reactionMap.create({
            data: {
                guildId: reactionMap.guildId,
                messageId: reactionMap.messageId,
                emoji: reactionMap.emoji,
                roleId: reactionMap.roleId,
                removeOnUnreact: reactionMap.removeOnUnreact,
            },
        });
        this.emit('reaction-map-added');
    }

}
