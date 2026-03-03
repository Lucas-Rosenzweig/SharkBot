import { Client, GuildMember, VoiceBasedChannel, GuildBasedChannel } from "discord.js";
import { addXpToUser } from "../utils/addXpToUser";
import { ConfigService } from "./ConfigService";
import { createLogger } from "../utils/logger";
import { VOICE_XP_INTERVAL_MS } from "../utils/constants";

const logger = createLogger('VoiceXP');

export class VoiceXpService {
    private static instance: VoiceXpService;
    private intervals: Map<string, NodeJS.Timeout> = new Map();

    private constructor() {}

    static getInstance(): VoiceXpService {
        if (!VoiceXpService.instance) {
            VoiceXpService.instance = new VoiceXpService();
        }
        return VoiceXpService.instance;
    }

    private buildKey(guildId: string, discordId: string): string {
        return `${guildId}:${discordId}`;
    }

    isTracking(guildId: string, discordId: string): boolean {
        return this.intervals.has(this.buildKey(guildId, discordId));
    }

    startTracking(guildId: string, discordId: string, client: Client): void {
        const key = this.buildKey(guildId, discordId);
        if (this.intervals.has(key)) return;

        const interval = setInterval(async () => {
            try {
                const guild = await client.guilds.fetch(guildId);
                const member = await guild.members.fetch(discordId).catch(() => null);

                if (!member || !member.voice.channel) {
                    this.stopTracking(guildId, discordId);
                    return;
                }

                if (guild.afkChannelId && member.voice.channelId === guild.afkChannelId) {
                    return;
                }

                const configService = ConfigService.getInstance();
                const config = await configService.getConfigForGuild(guildId);

                if (config.voiceXpRequireUnmuted) {
                    if (member.voice.serverMute || member.voice.serverDeaf) {
                        return;
                    }
                }

                const humanMembers = member.voice.channel.members.filter((m: GuildMember) => !m.user.bot);
                if (humanMembers.size < 2) {
                    return;
                }

                await addXpToUser(discordId, guildId, config.xpPerMinute, client, {
                    username: member.user.displayName,
                    avatarHash: member.user.avatar,
                });
                logger.info({ xp: config.xpPerMinute, user: member.user.tag, guild: guild.name }, 'Gave voice XP');
            } catch (error) {
                logger.error({ error, discordId, guildId }, 'Error giving voice XP');
            }
        }, VOICE_XP_INTERVAL_MS);

        this.intervals.set(key, interval);
        logger.info({ discordId, guildId }, 'Started tracking');
    }

    stopTracking(guildId: string, discordId: string): void {
        const key = this.buildKey(guildId, discordId);
        const interval = this.intervals.get(key);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(key);
            logger.info({ discordId, guildId }, 'Stopped tracking');
        }
    }

    async refreshChannel(channel: VoiceBasedChannel, client: Client): Promise<void> {
        const guildId = channel.guild.id;
        const humanMembers = channel.members.filter((m: GuildMember) => !m.user.bot);

        if (humanMembers.size >= 2) {
            for (const [, member] of humanMembers) {
                if (!this.isTracking(guildId, member.id)) {
                    this.startTracking(guildId, member.id, client);
                }
            }
        } else {
            for (const [, member] of humanMembers) {
                this.stopTracking(guildId, member.id);
            }
        }
    }

    async initializeFromGuilds(client: Client): Promise<void> {
        const guilds = client.guilds.cache;

        for (const [, guild] of guilds) {
            const channels = guild.channels.cache.filter(
                (ch: GuildBasedChannel): ch is VoiceBasedChannel => ch.isVoiceBased()
            );

            for (const [, channel] of channels) {
                if (channel.members.size > 0) {
                    await this.refreshChannel(channel, client);
                }
            }
        }

        logger.info({ count: this.intervals.size }, 'Initialized tracking for users across all guilds');
    }
}
