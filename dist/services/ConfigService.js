import { prisma } from "../utils/prisma";
export class ConfigService {
    static instance;
    constructor() { } // Private constructor for singleton
    // Singleton instance accessor
    static getInstance() {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }
    mapConfigToConfigType(config) {
        return {
            xpCooldown: config.xpCooldown,
            xpPerMessage: config.xpPerMessage,
            xpPerMinute: config.xpPerMinute,
            xpChannelId: config.xpChannelId || undefined,
            voiceXpRequireUnmuted: config.voiceXpRequireUnmuted,
        };
    }
    async getConfigForGuild(guildId) {
        // Fetch the configuration from the database
        let config = await prisma.config.findUnique({
            where: { guildId },
        });
        // If no config found create a default one with prisma
        if (!config) {
            config = await prisma.config.create({
                data: {
                    guildId,
                }
            });
        }
        return this.mapConfigToConfigType(config);
    }
    async setConfigForGuild(guildId, config) {
        // Upsert the configuration in the database
        await prisma.config.upsert({
            where: { guildId },
            update: {
                xpCooldown: config.xpCooldown,
                xpPerMessage: config.xpPerMessage,
                xpPerMinute: config.xpPerMinute,
                xpChannelId: config.xpChannelId || null,
                voiceXpRequireUnmuted: config.voiceXpRequireUnmuted,
            },
            create: {
                guildId,
            },
        });
    }
    async setXpCooldown(guildId, xpCooldown) {
        await prisma.config.upsert({
            where: { guildId },
            update: { xpCooldown, },
            create: { guildId, xpCooldown, },
        });
    }
    async setXpPerMessage(guildId, xpPerMessage) {
        await prisma.config.upsert({
            where: { guildId },
            update: { xpPerMessage, },
            create: { guildId, xpPerMessage, },
        });
    }
    async setXpPerMinute(guildId, xpPerMinute) {
        await prisma.config.upsert({
            where: { guildId },
            update: { xpPerMinute, },
            create: { guildId, xpPerMinute, },
        });
    }
    async setXpChannelId(guildId, xpChannelId) {
        await prisma.config.upsert({
            where: { guildId },
            update: { xpChannelId, },
            create: { guildId, xpChannelId, },
        });
    }
    async setVoiceXpRequireUnmuted(guildId, voiceXpRequireUnmuted) {
        await prisma.config.upsert({
            where: { guildId },
            update: { voiceXpRequireUnmuted },
            create: { guildId, voiceXpRequireUnmuted },
        });
    }
}
