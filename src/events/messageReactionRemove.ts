import { MessageReaction, PartialMessageReaction, User, PartialUser } from 'discord.js';
import { ReactionMapState } from '../state/reactionMapState';

export const name = 'messageReactionRemove';
export async function execute(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
    if (user.bot) return;
    const reactionMapState = ReactionMapState.getInstance();
    if (reaction.partial) {
        try { await reaction.fetch(); } catch { return; }
    }
    const message = reaction.message;
    const guild = message.guild;
    if (!guild) return;
    const emojiString = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
    const mapping = await reactionMapState.getRoleForReaction(guild.id, message.id, emojiString!);
    if (!mapping || !mapping.removeOnUnreact) return;
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    try {
        await member.roles.remove(mapping.roleId);
    } catch (e) {
        console.error('Erreur retrait rôle reaction:', e);
    }
}

