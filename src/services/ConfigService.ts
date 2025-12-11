import { Config } from "../type/Config";
import {prisma} from "../utils/prisma";

export class ConfigService {
    private static instance: ConfigService;

    private constructor() {} // Private constructor for singleton

    // Singleton instance accessor
    static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    private mapConfigToConfigType(config: any): Config {
        return {
            xpCooldown: config.xpCooldown,
            xpPerMessage: config.xpPerMessage,
            xpPerMinute: config.xpPerMinute,
            xpChannelId: config.xpChannelId || undefined,
        };
    }

    async getConfigForGuild(guildId: string): Promise<Config> {

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

    async setConfigForGuild(guildId: string, config: Config): Promise<void> {
        // Upsert the configuration in the database
        await prisma.config.upsert({
            where: { guildId },
            update: {
                xpCooldown: config.xpCooldown,
                xpPerMessage: config.xpPerMessage,
                xpPerMinute: config.xpPerMinute,
                xpChannelId: config.xpChannelId || null,
            },
            create: {
                guildId,
            },
        });
    }

    async setXpCooldown(guildId: string, xpCooldown: number): Promise<void> {
        await prisma.config.upsert({
            where: { guildId },
            update: {xpCooldown,},
            create: {guildId, xpCooldown,},
            }
        );
    }

    async setXpPerMessage(guildId: string, xpPerMessage: number): Promise<void> {
        await prisma.config.upsert({
            where: { guildId },
            update: {xpPerMessage,},
            create: {guildId, xpPerMessage,},
            }
        );
    }

    async setXpPerMinute(guildId: string, xpPerMinute: number): Promise<void> {
        await prisma.config.upsert({
            where: { guildId },
            update: {xpPerMinute,},
            create: {guildId, xpPerMinute,},
            }
        );
    }

    async setXpChannelId(guildId: string, xpChannelId: string | null): Promise<void> {
        await prisma.config.upsert({
            where: { guildId },
            update: {xpChannelId,},
            create: {guildId, xpChannelId,},
            }
        );
    }

}