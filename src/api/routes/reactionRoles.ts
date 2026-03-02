import { Router, Request, Response } from 'express';
import { Client, ChannelType } from 'discord.js';
import { requireAuth, requireGuildAdmin } from '../middleware/auth';
import { ReactionMapService } from '../../services/ReactionMapService';
import { prisma } from '../../utils/prisma';
import { validate, createReactionRoleSchema } from '../validators/schemas';

export function createReactionRolesRouter(client: Client): Router {
    const router = Router({ mergeParams: true });
    const reactionMapService = ReactionMapService.getInstance();

    // GET /api/guilds/:guildId/reaction-roles
    router.get('/', requireAuth, requireGuildAdmin, async (req: Request, res: Response) => {
        try {
            const guildId = req.params.guildId as string;
            const reactionMaps = reactionMapService.getReactionMapsForGuild(guildId);
            res.json(reactionMaps);
        } catch (error) {
            console.error('Error fetching reaction roles:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    });

    // POST /api/guilds/:guildId/reaction-roles
    // Triggers the bot to react on a Discord message, then persists the mapping
    router.post('/', requireAuth, requireGuildAdmin, validate(createReactionRoleSchema), async (req: Request, res: Response) => {
        try {
            const { messageId, emoji, roleId, removeOnUnreact } = req.body;

            const guildId = req.params.guildId as string;

            // Fetch the guild via Discord.js
            const guild = await client.guilds.fetch(guildId);

            // Fetch the target message across all text channels
            let message = null;
            const channels = await guild.channels.fetch();
            for (const [, channel] of channels) {
                if (!channel || channel.type !== ChannelType.GuildText) continue;
                try {
                    const foundMsg = await channel.messages.fetch(messageId);
                    if (foundMsg) {
                        message = foundMsg;
                        break;
                    }
                } catch {
                    // Ignore, message not in this channel
                }
            }

            if (!message) {
                res.status(404).json({ error: 'Message introuvable sur ce serveur' });
                return;
            }

            // React on the message with the emoji (bot reaction)
            await message.react(emoji).catch(() => {
                throw new Error('Échec de l\'ajout de la réaction. Émoji invalide ou permissions manquantes.');
            });

            // Persist via ReactionMapService
            await reactionMapService.addReactionMap(guildId, {
                guildId,
                messageId,
                emoji,
                roleId,
                removeOnUnreact,
            });

            res.status(201).json({ success: true, messageId, emoji, roleId });
        } catch (error) {
            console.error('Error creating reaction role:', error);
            const msg = error instanceof Error ? error.message : 'Erreur lors de la création du rôle de réaction';
            res.status(500).json({ error: msg });
        }
    });

    // DELETE /api/guilds/:guildId/reaction-roles/:id
    // Remove bot reaction from message, then delete DB entry
    router.delete('/:id', requireAuth, requireGuildAdmin, async (req: Request, res: Response) => {
        try {
            const guildId = req.params.guildId as string;
            const id = req.params.id as string;

            // Find the reaction map in DB
            const reactionMap = await prisma.reactionMap.findUnique({
                where: { id },
            });

            if (!reactionMap || reactionMap.guildId !== guildId) {
                res.status(404).json({ error: 'Reaction role introuvable' });
                return;
            }

            // Try to remove bot reaction from the Discord message
            try {
                const guild = await client.guilds.fetch(guildId);
                const channels = await guild.channels.fetch();
                for (const [, channel] of channels) {
                    if (!channel || channel.type !== ChannelType.GuildText) continue;
                    try {
                        const message = await channel.messages.fetch(reactionMap.messageId);
                        if (message) {
                            const reaction = message.reactions.cache.find(
                                (r) => {
                                    const emojiStr = r.emoji.id
                                        ? `<:${r.emoji.name}:${r.emoji.id}>`
                                        : r.emoji.name;
                                    return emojiStr === reactionMap.emoji;
                                }
                            );
                            if (reaction) {
                                await reaction.users.remove(client.user!.id);
                            }
                            break;
                        }
                    } catch {
                        // Message not in this channel, continue
                    }
                }
            } catch (err) {
                console.warn('Could not remove bot reaction from message:', err);
            }

            // Delete from DB
            await prisma.reactionMap.delete({ where: { id } });
            // Reload reaction maps
            await reactionMapService.load();

            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting reaction role:', error);
            res.status(500).json({ error: 'Erreur lors de la suppression du rôle de réaction' });
        }
    });

    return router;
}
