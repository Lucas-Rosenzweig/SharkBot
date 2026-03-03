import { Router, Request, Response } from 'express';
import { requireAuth, requireGuildAdmin } from '../middleware/auth';
import { prisma } from '../../utils/prisma';
import { validate, createLevelRoleSchema } from '../validators/schemas';
import { createLogger } from '../../utils/logger';

const logger = createLogger('API:LevelRoles');

const router = Router({ mergeParams: true });

// GET /api/guilds/:guildId/level-roles
router.get('/', requireAuth, requireGuildAdmin, async (req: Request, res: Response) => {
    try {
        const guildId = req.params.guildId as string;
        const levelRoles = await prisma.levelRole.findMany({
            where: { guildId },
            orderBy: { levelReq: 'asc' },
        });
        res.json(levelRoles);
    } catch (error) {
        logger.error({ error }, 'Error fetching level roles');
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST /api/guilds/:guildId/level-roles
router.post('/', requireAuth, requireGuildAdmin, validate(createLevelRoleSchema), async (req: Request, res: Response) => {
    try {
        const guildId = req.params.guildId as string;
        const { roleId, levelReq } = req.body;


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
    } catch (error) {
        logger.error({ error }, 'Error creating level role');
        res.status(500).json({ error: 'Erreur lors de la création du rôle de niveau' });
    }
});

// DELETE /api/guilds/:guildId/level-roles/:id
router.delete('/:id', requireAuth, requireGuildAdmin, async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.levelRole.delete({
            where: { id },
        });
        res.json({ success: true });
    } catch (error) {
        logger.error({ error }, 'Error deleting level role');
        res.status(500).json({ error: 'Erreur lors de la suppression du rôle de niveau' });
    }
});

export default router;
