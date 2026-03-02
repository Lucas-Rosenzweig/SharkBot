import EventEmitter from "node:events";
import { prisma } from "../utils/prisma";
export class ReactionMapService extends EventEmitter {
    store = new Map();
    static instance = null;
    constructor() {
        super();
    }
    // Singleton instance accessor
    static getInstance() {
        if (!ReactionMapService.instance) {
            ReactionMapService.instance = new ReactionMapService();
        }
        return ReactionMapService.instance;
    }
    //Load all reaction maps from the database
    async load() {
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
            const guildMap = new Map();
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
    getReactionMapsForGuild(guildId) {
        const guildMap = this.store.get(guildId);
        if (!guildMap) {
            return [];
        }
        return Array.from(guildMap.values());
    }
    async getRoleForReaction(guildId, messageId, emoji) {
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
    async getStore() {
        return this.store;
    }
    async addReactionMap(guildId, reactionMap) {
        let guildMap = this.store.get(guildId);
        if (!guildMap) {
            guildMap = new Map();
            this.store.set(guildId, guildMap);
        }
        // Persist to the database first to get the generated ID
        const createdRecord = await prisma.reactionMap.create({
            data: {
                guildId: reactionMap.guildId,
                messageId: reactionMap.messageId,
                emoji: reactionMap.emoji,
                roleId: reactionMap.roleId,
                removeOnUnreact: reactionMap.removeOnUnreact,
            },
        });
        // Add to the memory store with the real ID
        guildMap.set(createdRecord.id, {
            id: createdRecord.id,
            guildId: createdRecord.guildId,
            messageId: createdRecord.messageId,
            emoji: createdRecord.emoji,
            roleId: createdRecord.roleId,
            removeOnUnreact: createdRecord.removeOnUnreact,
        });
        this.emit('reaction-map-added');
        return createdRecord;
    }
}
