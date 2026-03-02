import { Router } from 'express';
import { requireAuth, requireGuildAdmin } from '../middleware/auth';
import { prisma } from '../../utils/prisma';
const router = Router({ mergeParams: true });
// GET /api/guilds/:guildId/level-roles
router.get('/', requireAuth, requireGuildAdmin, async (req, res) => {
    try {
        const guildId = req.params.guildId;
        const levelRoles = await prisma.levelRole.findMany({
            where: { guildId },
            orderBy: { levelReq: 'asc' },
        });
        res.json(levelRoles);
    }
    catch (error) {
        console.error('Error fetching level roles:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// POST /api/guilds/:guildId/level-roles
router.post('/', requireAuth, requireGuildAdmin, async (req, res) => {
    try {
        const guildId = req.params.guildId;
        const { roleId, levelReq } = req.body;
        if (!roleId || levelReq === undefined) {
            res.status(400).json({ error: 'roleId et levelReq sont requis' });
            return;
        }
        // Check if already exists
        const existing = await prisma.levelRole.findFirst({
            where: { guildId, roleId },
        });
        if (existing) {
            res.status(409).json({ error: 'Ce rôle est déjà configuré pour un niveau' });
            return;
        }
        const levelRole = await prisma.levelRole.create({
            data: {
                guildId,
                roleId,
                levelReq: Number(levelReq),
            },
        });
        res.status(201).json(levelRole);
    }
    catch (error) {
        console.error('Error creating level role:', error);
        res.status(500).json({ error: 'Erreur lors de la création du rôle de niveau' });
    }
});
// DELETE /api/guilds/:guildId/level-roles/:id
router.delete('/:id', requireAuth, requireGuildAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        await prisma.levelRole.delete({
            where: { id },
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting level role:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression du rôle de niveau' });
    }
});
export default router;
