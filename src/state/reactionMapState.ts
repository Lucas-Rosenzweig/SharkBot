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

    async getRoleForReaction(guildId: string, messageId: string, emoji: string): Promise<ReactionMapRecord | null> {
        const guildMap = this.store.get(guildId);
        if (!guildMap) {
            console.log(`Aucun mapping trouvé pour la guilde ${guildId}`);
            return null;
        }
        console.log(`Recherche de mapping pour guildId=${guildId}, messageId=${messageId}, emoji=${emoji}`);
        for (const reactionMap of guildMap.values()) {
            console.log(`Vérification du mapping:`, reactionMap);
            if (reactionMap.messageId === messageId && reactionMap.emoji === emoji) {
                console.log(`Mapping trouvé avant retour:`, reactionMap);
                return reactionMap;
            }
        }
        console.log(`Aucun mapping correspondant trouvé pour messageId=${messageId}, emoji=${emoji}`);
        return null;
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
