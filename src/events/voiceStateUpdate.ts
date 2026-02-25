import { VoiceState } from "discord.js";
import { VoiceXpService } from "../services/VoiceXpService";

export const name = 'voiceStateUpdate';

export async function execute(oldState: VoiceState, newState: VoiceState) {
    // Ignorer les bots
    if (newState.member?.user.bot) return;

    const voiceXpService = VoiceXpService.getInstance();
    const client = newState.client;

    // Refresh l'ancien salon (un membre est parti → vérifier si les autres doivent encore être trackés)
    if (oldState.channel && oldState.channelId !== newState.channelId) {
        await voiceXpService.refreshChannel(oldState.channel, client);
    }

    // Refresh le nouveau salon (un membre est arrivé → vérifier si le tracking doit démarrer)
    if (newState.channel) {
        await voiceXpService.refreshChannel(newState.channel, client);
    }

    // Cas où l'utilisateur quitte complètement le vocal (pas de nouveau salon)
    if (!newState.channel && oldState.channel && newState.member) {
        voiceXpService.stopTracking(oldState.guild.id, newState.member.id);
    }
}

