import { Router } from 'express';
import { requireAuth, requireGuildAdmin } from '../middleware/auth';
import { ConfigService } from '../../services/ConfigService';
const router = Router({ mergeParams: true });
const configService = ConfigService.getInstance();
// GET /api/guilds/:guildId/config
router.get('/', requireAuth, requireGuildAdmin, async (req, res) => {
    try {
        const guildId = req.params.guildId;
        const config = await configService.getConfigForGuild(guildId);
        res.json(config);
    }
    catch (error) {
        console.error('Error fetching config:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// PUT /api/guilds/:guildId/config
router.put('/', requireAuth, requireGuildAdmin, async (req, res) => {
    try {
        const guildId = req.params.guildId;
        const { xpCooldown, xpPerMessage, xpPerMinute, xpChannelId, voiceXpRequireUnmuted } = req.body;
        const config = await configService.getConfigForGuild(guildId);
        // Update only provided fields
        const updatedConfig = {
            xpCooldown: xpCooldown ?? config.xpCooldown,
            xpPerMessage: xpPerMessage ?? config.xpPerMessage,
            xpPerMinute: xpPerMinute ?? config.xpPerMinute,
            xpChannelId: xpChannelId !== undefined ? (xpChannelId || undefined) : config.xpChannelId,
            voiceXpRequireUnmuted: voiceXpRequireUnmuted ?? config.voiceXpRequireUnmuted,
        };
        await configService.setConfigForGuild(guildId, updatedConfig);
        res.json(updatedConfig);
    }
    catch (error) {
        console.error('Error updating config:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration' });
    }
});
export default router;
