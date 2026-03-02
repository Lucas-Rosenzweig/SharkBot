const ADMINISTRATOR_PERMISSION = 0x8;
/**
 * Middleware: checks the user is authenticated via OAuth2
 */
export function requireAuth(req, res, next) {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        res.status(401).json({ error: 'Non authentifié' });
        return;
    }
    next();
}
/**
 * Middleware: checks the user is admin of the guild specified in :guildId
 */
export function requireGuildAdmin(req, res, next) {
    const user = req.user;
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
