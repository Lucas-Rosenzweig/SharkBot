import { Config } from '../type/Config';
import { prisma } from '../utils/prisma';
import { createLogger } from '../utils/logger';

const logger = createLogger('ConfigService');

export class ConfigService {
    private static instance: ConfigService;

    private constructor() {}

    static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    private mapToConfig(config: {
        xpCooldown: number;
        xpPerMessage: number;
        xpPerMinute: number;
        xpChannelId: string | null;
        voiceXpRequireUnmuted: boolean;
        levelUpMessage: string | null;
    }): Config {
        return {
            xpCooldown: config.xpCooldown,
            xpPerMessage: config.xpPerMessage,
            xpPerMinute: config.xpPerMinute,
            xpChannelId: config.xpChannelId || undefined,
            voiceXpRequireUnmuted: config.voiceXpRequireUnmuted,
            levelUpMessage: config.levelUpMessage ?? null,
        };
    }

    async getConfigForGuild(guildId: string): Promise<Config> {
        // Ensure the Guild row exists before upserting Config (FK constraint)
        await prisma.guild.upsert({
            where: { id: guildId },
            update: {},
            create: { id: guildId },
        });

        const config = await prisma.config.upsert({
            where: { guildId },
            update: {},
            create: { guildId },
        });

        return this.mapToConfig(config);
    }

    async setConfigForGuild(guildId: string, config: Config): Promise<void> {
        await prisma.guild.upsert({
            where: { id: guildId },
            update: {},
            create: { id: guildId },
        });

        await prisma.config.upsert({
            where: { guildId },
            update: {
                xpCooldown: config.xpCooldown,
                xpPerMessage: config.xpPerMessage,
                xpPerMinute: config.xpPerMinute,
                xpChannelId: config.xpChannelId || null,
                voiceXpRequireUnmuted: config.voiceXpRequireUnmuted,
                levelUpMessage: config.levelUpMessage,
            },
            create: {
                guildId,
                xpCooldown: config.xpCooldown,
                xpPerMessage: config.xpPerMessage,
                xpPerMinute: config.xpPerMinute,
                xpChannelId: config.xpChannelId || null,
                voiceXpRequireUnmuted: config.voiceXpRequireUnmuted,
                levelUpMessage: config.levelUpMessage,
            },
        });
        logger.info({ guildId }, 'Config updated for guild');
    }

    /**
     * Updates a single config field using upsert.
     * Avoids repetitive per-field setter methods.
     */
    private async upsertField(guildId: string, field: string, value: unknown): Promise<void> {
        await prisma.guild.upsert({
            where: { id: guildId },
            update: {},
            create: { id: guildId },
        });

        await prisma.config.upsert({
            where: { guildId },
            update: { [field]: value },
            create: { guildId, [field]: value },
        });
        logger.info({ guildId, field, value }, 'Config field updated');
    }

    async setXpCooldown(guildId: string, xpCooldown: number): Promise<void> {
        await this.upsertField(guildId, 'xpCooldown', xpCooldown);
    }

    async setXpPerMessage(guildId: string, xpPerMessage: number): Promise<void> {
        await this.upsertField(guildId, 'xpPerMessage', xpPerMessage);
    }

    async setXpPerMinute(guildId: string, xpPerMinute: number): Promise<void> {
        await this.upsertField(guildId, 'xpPerMinute', xpPerMinute);
    }

    async setXpChannelId(guildId: string, xpChannelId: string | null): Promise<void> {
        await this.upsertField(guildId, 'xpChannelId', xpChannelId);
    }

    async setVoiceXpRequireUnmuted(guildId: string, voiceXpRequireUnmuted: boolean): Promise<void> {
        await this.upsertField(guildId, 'voiceXpRequireUnmuted', voiceXpRequireUnmuted);
    }

}