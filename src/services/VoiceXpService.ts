import { Client, GuildMember, VoiceBasedChannel, GuildBasedChannel } from "discord.js";
import { addXpToUser } from "../utils/addXpToUser";
import { ConfigService } from "./ConfigService";

const VOICE_XP_INTERVAL_MS = 60_000; // 1 minute

export class VoiceXpService {
    private static instance: VoiceXpService;
    private intervals: Map<string, NodeJS.Timeout> = new Map(); // key: guildId:discordId

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
        if (this.intervals.has(key)) return; // Already tracking

        const interval = setInterval(async () => {
            try {
                const guild = await client.guilds.fetch(guildId);
                const member = await guild.members.fetch(discordId).catch(() => null);

                if (!member || !member.voice.channel) {
                    this.stopTracking(guildId, discordId);
                    return;
                }

                // Vérifier que le membre n'est pas dans le channel AFK
                if (guild.afkChannelId && member.voice.channelId === guild.afkChannelId) {
                    return; // Pas d'XP dans le channel AFK, mais on continue de tracker
                }

                // Vérifier la config voiceXpRequireUnmuted
                const configService = ConfigService.getInstance();
                const config = await configService.getConfigForGuild(guildId);

                if (config.voiceXpRequireUnmuted) {
                    if (member.voice.serverMute || member.voice.serverDeaf) {
                        return; // Pas d'XP si mute/deaf serveur
                    }
                }

                // Vérifier qu'il y a au moins 2 humains non-bot dans le salon
                const humanMembers = member.voice.channel.members.filter((m: GuildMember) => !m.user.bot);
                if (humanMembers.size < 2) {
                    return; // Pas d'XP seul
                }

                await addXpToUser(discordId, guildId, config.xpPerMinute, client);
                console.log(`[VoiceXP] Gave ${config.xpPerMinute} XP to ${member.user.tag} in guild ${guild.name}`);
            } catch (error) {
                console.error(`[VoiceXP] Error giving XP to ${discordId} in guild ${guildId}:`, error);
            }
        }, VOICE_XP_INTERVAL_MS);

        this.intervals.set(key, interval);
        console.log(`[VoiceXP] Started tracking ${discordId} in guild ${guildId}`);
    }

    stopTracking(guildId: string, discordId: string): void {
        const key = this.buildKey(guildId, discordId);
        const interval = this.intervals.get(key);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(key);
            console.log(`[VoiceXP] Stopped tracking ${discordId} in guild ${guildId}`);
        }
    }

    /**
     * Réévalue tous les membres d'un salon vocal.
     * Démarre le tracking pour ceux éligibles, stoppe pour ceux qui ne le sont plus.
     */
    async refreshChannel(channel: VoiceBasedChannel, client: Client): Promise<void> {
        const guildId = channel.guild.id;
        const humanMembers = channel.members.filter((m: GuildMember) => !m.user.bot);

        if (humanMembers.size >= 2) {
            // Au moins 2 humains : démarrer le tracking pour tous
            for (const [, member] of humanMembers) {
                if (!this.isTracking(guildId, member.id)) {
                    this.startTracking(guildId, member.id, client);
                }
            }
        } else {
            // Moins de 2 humains : stopper le tracking pour tous les membres de ce salon
            for (const [, member] of humanMembers) {
                this.stopTracking(guildId, member.id);
            }
        }
    }

    /**
     * Initialise le tracking pour tous les salons vocaux de toutes les guilds.
     * Utilisé au démarrage du bot pour reprendre le tracking après un redémarrage.
     */
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

        console.log(`[VoiceXP] Initialized tracking for ${this.intervals.size} users across all guilds`);
    }
}






