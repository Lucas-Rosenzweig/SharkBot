import { Router } from 'express';
import { requireAuth, requireGuildAdmin } from '../middleware/auth';
import { prisma } from '../../utils/prisma';
import { getXpForNextLevel } from '../../utils/addXpToUser';
const router = Router({ mergeParams: true });
// GET /api/guilds/:guildId/users — leaderboard
router.get('/', requireAuth, requireGuildAdmin, async (req, res) => {
    try {
        const guildId = req.params.guildId;
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
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// PUT /api/guilds/:guildId/users/:discordId — edit user level/XP
router.put('/:discordId', requireAuth, requireGuildAdmin, async (req, res) => {
    try {
        const guildId = req.params.guildId;
        const discordId = req.params.discordId;
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
        }
        else {
            xpCurrent = user.xpCurrent;
        }
        const updated = await prisma.user.update({
            where: { discordId },
            data: {
                level: newLevel,
                xpTotal: newXpTotal,
                xpCurrent,
                xpNext,
            },
            select: { id: true, discordId: true, guildId: true, username: true, avatarHash: true, xpTotal: true, xpCurrent: true, xpNext: true, level: true },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour' });
    }
});
export default router;
