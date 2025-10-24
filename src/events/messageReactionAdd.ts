import { MessageReaction, PartialMessageReaction, User, PartialUser } from 'discord.js';
import { ReactionMapState, ReactionMapRecord } from '../state/reactionMapState';

export const name = 'messageReactionAdd';
export async function execute(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
    if (user.bot) return;
    const reactionMapState = ReactionMapState.getInstance();
    if (reaction.partial) {
        try { await reaction.fetch(); } catch { return; }
    }
    const message = reaction.message;
    const guild = message.guild;
    if (!guild) return;
    // Emoji string format
    const emojiString = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
    // Cherche le mapping pour cet emoji
    const mapping: ReactionMapRecord | null = await reactionMapState.getRoleForReaction(guild.id, message.id, emojiString!);
    if (!mapping) return;
    if (!mapping.roleId) {
        console.error('reaction roleId manquant:', mapping.roleId);
        return;
    }
    // Ajoute le rôle
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    try {
        await member.roles.add(mapping.roleId);
    } catch (e) {
        console.error('Erreur ajout rôle reaction:', e, 'roleId:', mapping.roleId);
    }
}
