import EventEmitter from "node:events";
import { prisma } from "../utils/prisma";

export type ReactionMapRecord = {
    id: string;
    guildId: string;
    messageId: string;
    emoji: string;
    roleId: string;
    removeOnUnreact: boolean;
};

export class ReactionMapState extends EventEmitter {
    private store: Map<string, Map<string, ReactionMapRecord>> = new Map();
    private static instance: ReactionMapState | null = null;

    private constructor() { //Constructeur privé car singleton
        super();
    }

    // Singleton instance accessor
    static getInstance(): ReactionMapState {
        if (!ReactionMapState.instance) {
            ReactionMapState.instance = new ReactionMapState();
        }
        return ReactionMapState.instance;
    }

    //Load all reaction maps from the database
    async load(){
        this.store.clear(); // Clear existing data

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
        console.log("ReactionMapState loaded reaction maps for", this.store.size, "guilds.");
        this.emit('loaded-reaction-maps');
    }

     getReactionMapsForGuild(guildId: string): ReactionMapRecord[] {
        const guildMap = this.store.get(guildId);
        if (!guildMap) {
            return [];
        }
        return Array.from(guildMap.values());
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
