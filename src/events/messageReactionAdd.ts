import { MessageReaction, User, TextChannel, Snowflake } from 'discord.js';
import { findSetupByTargetMessageId, createSetup, buildUi } from '../state/reactionRoleSetup';

export const name = 'messageReactionAdd';
export const once = false;

function normalizeStoredEmoji(reaction: MessageReaction) {
  // retourne une représentation stockée cohérente pour la comparaison et l'affichage
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
        console.error('Impossible de fetch la réaction partielle:', err);
        return;
      }
    }

    const message = reaction.message;
    const targetMessageId = message?.id;
    if (!targetMessageId) return;

    const setup = findSetupByTargetMessageId(targetMessageId);
    if (!setup) return; // message non géré

    // identifier l'emoji et chercher une clé correspondante
    const storedEmoji = normalizeStoredEmoji(reaction);

    let key = Object.keys(setup.roles).find(k => setup.roles[k].emoji === storedEmoji);

    // si pas trouvé, on crée une nouvelle entrée dans le setup (roleId = null)
    if (!key) {
      // crée une clé unique basée sur le nom/id
      const base = storedEmoji.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 24) || 'emoji';
      let candidate = `emoji_${base}`;
      let i = 1;
      while (setup.roles[candidate]) {
        candidate = `emoji_${base}_${i}`;
        i++;
      }
      key = candidate as string;
      setup.roles[key] = { emoji: storedEmoji, roleId: null };

      // sauvegarder le setup
      createSetup(setup);

      // Le bot doit réagir lui-même avec le même emoji et supprimer la réaction initiale de l'utilisateur
      try {
        // utiliser la forme string de l'emoji (ex: '🔥' ou '<:name:id>')
        const emojiResolvable = reaction.emoji.toString();

        // Ajouter la réaction par le bot si pas déjà présente (react est idempotent)
        try {
          await message.react(emojiResolvable);
        } catch (err) {
          console.error('Impossible pour le bot d\'ajouter la réaction au message cible :', err);
        }

        // Supprimer la réaction initiale de l'utilisateur (require Manage Messages)
        try {
          // reaction.users.remove retire la réaction spécifique d'un utilisateur
          await reaction.users.remove(user.id);
        } catch (err) {
          console.error('Impossible de retirer la réaction de l\'utilisateur :', err);
        }
      } catch (err) {
        console.error('Erreur lors du placement/suppression de réaction par le bot :', err);
      }

      // rééditer le message de setup pour afficher le nouveau select
      try {
        const client = message.client;
        const channel = await client.channels.fetch(setup.channelId) as TextChannel | null;
        if (!channel) return;
        const msg = await channel.messages.fetch(setup.setupMessageId as Snowflake);
        if (!msg) return;
        const container = buildUi(setup);
        await msg.edit({ components: [container], flags: 1 << 15 /* MessageFlags.IsComponentsV2 */ });
      } catch (err) {
        console.error('Impossible d\'éditer le message de setup après ajout d\'émoji :', err);
      }
    }

    // si roleId est présent : appliquer le rôle à l'utilisateur (comportement existant)
    const roleId = setup.roles[key].roleId;
    if (!roleId) return;

    const guild = message.guild;
    if (!guild) return;
    try {
      const member = await guild.members.fetch(user.id);
      if (!member) return;
      await member.roles.add(roleId);
    } catch (err) {
      console.error('Erreur lors de l\'ajout du rôle:', err);
    }

  } catch (error) {
    console.error('Erreur dans messageReactionAdd handler:', error);
  }
}
