import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// ── Discord Snowflake (string of digits) ────────────────────
const snowflake = z.string().regex(/^\d{17,20}$/, 'Invalid Discord snowflake ID');

// ── Config (PUT /api/guilds/:guildId/config) ────────────────
export const updateConfigSchema = z.object({
    xpCooldown: z.number().int().positive().optional(),
    xpPerMessage: z.number().int().positive().optional(),
    xpPerMinute: z.number().int().positive().optional(),
    xpChannelId: z.union([snowflake, z.literal(''), z.null()]).optional(),
    voiceXpRequireUnmuted: z.boolean().optional(),
});

// ── Level Roles (POST /api/guilds/:guildId/level-roles) ─────
export const createLevelRoleSchema = z.object({
    roleId: snowflake,
    levelReq: z.number().int().positive(),
});

// ── Reaction Roles (POST /api/guilds/:guildId/reaction-roles)
export const createReactionRoleSchema = z.object({
    messageId: snowflake,
    emoji: z.string().min(1).max(100),
    roleId: snowflake,
    removeOnUnreact: z.boolean().default(true),
});

// ── Users (PUT /api/guilds/:guildId/users/:discordId) ───────
export const updateUserSchema = z.object({
    level: z.number().int().min(1).optional(),
    xpTotal: z.number().int().min(0).optional(),
});

// ── Generic validation middleware ────────────────────────────
export function validate(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.issues.map((i) => ({
                path: i.path.join('.'),
                message: i.message,
            }));
            res.status(400).json({ error: 'Validation failed', details: errors });
            return;
        }
        req.body = result.data;
        next();
    };
}

