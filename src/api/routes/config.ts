import { Router, Request, Response } from 'express';
import { requireAuth, requireGuildAdmin } from '../middleware/auth';
import { ConfigService } from '../../services/ConfigService';
import { validate, updateConfigSchema } from '../validators/schemas';
import { createLogger } from '../../utils/logger';

const logger = createLogger('API:Config');

const router = Router({ mergeParams: true });

const configService = ConfigService.getInstance();

// GET /api/guilds/:guildId/config
router.get('/', requireAuth, requireGuildAdmin, async (req: Request, res: Response) => {
    try {
        const guildId = req.params.guildId as string;
        const config = await configService.getConfigForGuild(guildId);
        res.json(config);
    } catch (error) {
        logger.error({ error }, 'Error fetching config');
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT /api/guilds/:guildId/config
router.put('/', requireAuth, requireGuildAdmin, validate(updateConfigSchema), async (req: Request, res: Response) => {
    try {
        const guildId = req.params.guildId as string;
        const { xpCooldown, xpPerMessage, xpPerMinute, xpChannelId, voiceXpRequireUnmuted, levelUpMessage } = req.body;

        const config = await configService.getConfigForGuild(guildId);

        // Update only provided fields
        const updatedConfig = {
            xpCooldown: xpCooldown ?? config.xpCooldown,
            xpPerMessage: xpPerMessage ?? config.xpPerMessage,
            xpPerMinute: xpPerMinute ?? config.xpPerMinute,
            xpChannelId: xpChannelId !== undefined ? (xpChannelId || undefined) : config.xpChannelId,
            voiceXpRequireUnmuted: voiceXpRequireUnmuted ?? config.voiceXpRequireUnmuted,
            levelUpMessage: levelUpMessage !== undefined ? levelUpMessage : config.levelUpMessage,
        };

        await configService.setConfigForGuild(guildId, updatedConfig);

        res.json(updatedConfig);
    } catch (error) {
        logger.error({ error }, 'Error updating config');
        res.status(500).json({ error: 'Erreur lors de la mise à jour de la configuration' });
    }
});

export default router;


