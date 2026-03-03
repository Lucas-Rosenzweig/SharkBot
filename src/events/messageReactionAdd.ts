import { MessageReaction, PartialMessageReaction, User, PartialUser } from 'discord.js';
import { ReactionMapService } from '../services/ReactionMapService';
import { createLogger } from '../utils/logger';

const logger = createLogger('ReactionAdd');

export const name = 'messageReactionAdd';
export async function execute(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
    if (user.bot) return;
    const reactionMapState = ReactionMapService.getInstance();

    if (reaction.partial) {
        try { await reaction.fetch(); } catch { return; }
    }

    const message = reaction.message;
    const guild = message.guild;
    if (!guild) return;

    // Emoji string format
    const emojiString = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
    // Cherche le mapping pour cet emoji
    const mapping = reactionMapState.getRoleForReaction(guild.id, message.id, emojiString!);
    if (!mapping) return;

    if (!mapping.roleId) {
        logger.error({ roleId: mapping.roleId }, 'Reaction roleId missing');
        return;
    }

    // Ajoute le rôle
    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    try {
        await member.roles.add(mapping.roleId);
    } catch (error) {
        logger.error({ error, roleId: mapping.roleId }, 'Failed to add reaction role');
    }
}
