import { Router, Request, Response } from 'express';
import { requireAuth, requireGuildAdmin } from '../middleware/auth';
import { prisma } from '../../utils/prisma';
import { eventBus } from '../../services/EventBus';
import { getXpForNextLevel } from '../../utils/addXpToUser';
import { validate, updateUserSchema } from '../validators/schemas';
import { createLogger } from '../../utils/logger';

const logger = createLogger('API:Users');

const router = Router({ mergeParams: true });

// GET /api/guilds/:guildId/users — leaderboard
router.get('/', requireAuth, requireGuildAdmin, async (req: Request, res: Response) => {
    try {
        const guildId = req.params.guildId as string;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: { guildId },
                select: { id: true, discordId: true, guildId: true, username: true, avatarHash: true, xpTotal: true, xpCurrent: true, xpNext: true, level: true },
                orderBy: { xpTotal: 'desc' },
                skip,
                take: limit,
            }),
            prisma.user.count({
                where: { guildId },
            }),
        ]);

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error({ error }, 'Error fetching users');
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT /api/guilds/:guildId/users/:discordId — edit user level/XP
router.put('/:discordId', requireAuth, requireGuildAdmin, validate(updateUserSchema), async (req: Request, res: Response) => {
    try {
        const guildId = req.params.guildId as string;
        const discordId = req.params.discordId as string;
        const { level, xpTotal } = req.body;

        const user = await prisma.user.findFirst({
            where: { guildId, discordId },
        });

        if (!user) {
            res.status(404).json({ error: 'Utilisateur introuvable' });
            return;
        }

        const newLevel = level !== undefined ? Math.max(1, Number(level)) : user.level;
        const newXpTotal = xpTotal !== undefined ? Math.max(0, Number(xpTotal)) : user.xpTotal;
        const xpNext = getXpForNextLevel(newLevel);

        // Recalculate xpCurrent based on new level
        // xpCurrent represents progress toward next level
        let xpCurrent = 0;
        if (xpTotal !== undefined) {
            // If XP total changed, recalculate current XP from scratch
            let tempLevel = 1;
            let remaining = newXpTotal;
            while (remaining >= getXpForNextLevel(tempLevel) && tempLevel < newLevel) {
                remaining -= getXpForNextLevel(tempLevel);
                tempLevel++;
            }
            xpCurrent = remaining;
        } else {
            xpCurrent = user.xpCurrent;
        }

        const updated = await prisma.user.update({
            where: { guildId_discordId: { guildId, discordId } },
            data: {
                level: newLevel,
                xpTotal: newXpTotal,
                xpCurrent,
                xpNext,
            },
            select: { id: true, discordId: true, guildId: true, username: true, avatarHash: true, xpTotal: true, xpCurrent: true, xpNext: true, level: true },
        });

        eventBus.emitGuildEvent('user:update', guildId, updated);

        res.json(updated);
    } catch (error) {
        logger.error({ error }, 'Error updating user');
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
});

export default router;
