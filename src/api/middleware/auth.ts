import { Request, Response, NextFunction } from 'express';
import { ADMINISTRATOR_PERMISSION } from '../../utils/constants';

// Extend express-session to include our passport user
declare module 'express-session' {
    interface SessionData {
        passport?: {
            user?: OAuthUser;
        };
    }
}

export interface OAuthUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    guilds: OAuthGuild[];
    accessToken: string;
    refreshToken: string;
}

export interface OAuthGuild {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: number;
}


/**
 * Middleware: checks the user is authenticated via OAuth2
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
    }
    next();
}

/**
 * Middleware: checks the user is admin of the guild specified in :guildId
 */
export function requireGuildAdmin(req: Request, res: Response, next: NextFunction): void {
    const user = req.user as OAuthUser | undefined;
    if (!user) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
    }

    const guildId = req.params.guildId;
    if (!guildId) {
        res.status(400).json({ error: 'guildId manquant' });
        return;
    }

    const guild = user.guilds?.find((g) => g.id === guildId);
    if (!guild) {
        res.status(403).json({ error: 'Vous n\'êtes pas membre de ce serveur' });
        return;
    }

    // Check ADMINISTRATOR permission or owner
    const isAdmin = guild.owner || (guild.permissions & ADMINISTRATOR_PERMISSION) !== 0;
    if (!isAdmin) {
        res.status(403).json({ error: 'Vous n\'êtes pas administrateur de ce serveur' });
        return;
    }

    next();
}

