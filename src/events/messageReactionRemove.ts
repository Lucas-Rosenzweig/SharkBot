import { MessageReaction, User } from 'discord.js';
import { findSetupByTargetMessageId } from '../state/reactionRoleSetup';

export const name = 'messageReactionRemove';
export const once = false;

function normalizeStoredEmojiFromReaction(reaction: MessageReaction) {
  const emojiId = reaction.emoji.id ?? null;
  const emojiName = reaction.emoji.name ?? null;
  if (emojiId && emojiName) return `<:${emojiName}:${emojiId}>`;
  if (emojiName) return emojiName;
  return String(reaction.emoji);
}

export async function execute(reaction: MessageReaction, user: User) {
  try {
    // Ignorer les bots
    if (user.bot) return;

    // Fetch partials si nécessaire
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (err) {
        console.error('Impossible de fetch la réaction partielle (remove):', err);
        return;
      }
    }

    const message = reaction.message;
    const targetMessageId = message?.id;
    if (!targetMessageId) return;

    const setup = findSetupByTargetMessageId(targetMessageId);
    if (!setup) return; // message non géré

    const storedEmoji = normalizeStoredEmojiFromReaction(reaction);

    const key = Object.keys(setup.roles).find(k => setup.roles[k].emoji === storedEmoji);
    if (!key) return;

    const roleId = setup.roles[key].roleId;
    if (!roleId) return; // pas de rôle configuré pour cet émoji

    const guild = message.guild;
    if (!guild) return;

    try {
      const member = await guild.members.fetch(user.id);
      if (!member) return;
      await member.roles.remove(roleId);
    } catch (err) {
      console.error('Erreur lors de la suppression du rôle (reaction remove):', err);
    }
  } catch (error) {
    console.error('Erreur dans messageReactionRemove handler:', error);
  }
}

