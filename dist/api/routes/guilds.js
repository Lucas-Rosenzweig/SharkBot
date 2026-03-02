import { Router } from 'express';
import { ChannelType } from 'discord.js';
import { requireAuth, requireGuildAdmin } from '../middleware/auth';
import { prisma } from '../../utils/prisma';
export function createGuildsRouter(client) {
    const router = Router();
    // GET /api/guilds — guilds the user is admin of AND the bot is in
    router.get('/', requireAuth, async (req, res) => {
        try {
            const user = req.user;
            const ADMIN_PERM = 0x8;
            // User guilds where they are admin or owner
            const adminGuilds = user.guilds.filter((g) => g.owner || (g.permissions & ADMIN_PERM) !== 0);
            // Bot guilds from DB
            const botGuilds = await prisma.guild.findMany();
            const botGuildIds = new Set(botGuilds.map((g) => g.id));
            // Intersection
            const guilds = adminGuilds
                .filter((g) => botGuildIds.has(g.id))
                .map((g) => ({
                id: g.id,
                name: g.name,
                icon: g.icon,
            }));
            res.json(guilds);
        }
        catch (error) {
            console.error('Error fetching guilds:', error);
            res.status(500).json({ error: 'Erreur serveur' });
        }
    });
    // GET /api/guilds/:guildId/channels — text channels of the guild
    router.get('/:guildId/channels', requireAuth, requireGuildAdmin, async (req, res) => {
        try {
            const guildId = req.params.guildId;
            const guild = await client.guilds.fetch(guildId);
            const channels = await guild.channels.fetch();
            const textChannels = channels
                .filter((c) => c !== null && c.type === ChannelType.GuildText)
                .map((c) => ({
                id: c.id,
                name: c.name,
            }));
            res.json(textChannels);
        }
        catch (error) {
            console.error('Error fetching channels:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des salons' });
        }
    });
    // GET /api/guilds/:guildId/roles — roles of the guild
    router.get('/:guildId/roles', requireAuth, requireGuildAdmin, async (req, res) => {
        try {
            const guildId = req.params.guildId;
            const guild = await client.guilds.fetch(guildId);
            const roles = await guild.roles.fetch();
            const roleList = roles
                .filter((r) => !r.managed && r.name !== '@everyone')
                .sort((a, b) => b.position - a.position)
                .map((r) => ({
                id: r.id,
                name: r.name,
                color: r.hexColor,
            }));
            res.json(roleList);
        }
        catch (error) {
            console.error('Error fetching roles:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des rôles' });
        }
    });
    // GET /api/guilds/:guildId/channels/:channelId/messages — recent messages a channel
    router.get('/:guildId/channels/:channelId/messages', requireAuth, requireGuildAdmin, async (req, res) => {
        try {
            const guildId = req.params.guildId;
            const channelId = req.params.channelId;
            const guild = await client.guilds.fetch(guildId);
            const channel = await guild.channels.fetch(channelId);
            if (!channel || !channel.isTextBased()) {
                return res.status(404).json({ error: 'Salon introuvable ou invalide' });
            }
            const messages = await channel.messages.fetch({ limit: 50 });
            const messageList = messages.map((m) => {
                let textPreview = m.content || '';
                if (!textPreview && m.embeds.length > 0)
                    textPreview = '[Embed]';
                if (!textPreview && m.attachments.size > 0)
                    textPreview = '[Pièce jointe]';
                if (!textPreview)
                    textPreview = '[Message sans texte]';
                if (textPreview.length > 100) {
                    textPreview = textPreview.substring(0, 100) + '...';
                }
                return {
                    id: m.id,
                    content: textPreview,
                    author: {
                        username: m.author.username,
                        avatar: m.author.displayAvatarURL(),
                    },
                    timestamp: m.createdTimestamp,
                };
            });
            res.json(messageList);
        }
        catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des messages' });
        }
    });
    // GET /api/guilds/:guildId/emojis — custom emojis of the guild
    router.get('/:guildId/emojis', requireAuth, requireGuildAdmin, async (req, res) => {
        try {
            const guildId = req.params.guildId;
            const guild = await client.guilds.fetch(guildId);
            const emojis = await guild.emojis.fetch();
            const emojiList = emojis.map((e) => ({
                id: e.id,
                name: e.name,
                url: e.imageURL(),
                animated: e.animated,
                formatted: e.animated ? `<a:${e.name}:${e.id}>` : `<:${e.name}:${e.id}>`,
            }));
            res.json(emojiList);
        }
        catch (error) {
            console.error('Error fetching emojis:', error);
            res.status(500).json({ error: 'Erreur lors de la récupération des émojis' });
        }
    });
    return router;
}
