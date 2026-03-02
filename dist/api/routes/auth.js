import { Router } from 'express';
import passport from 'passport';
const router = Router();
// Redirect to Discord OAuth2
router.get('/discord', passport.authenticate('discord', {
    scope: ['identify', 'guilds'],
}));
// OAuth2 callback
router.get('/discord/callback', passport.authenticate('discord', { failureRedirect: '/login' }), (_req, res) => {
    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:5173';
    res.redirect(`${dashboardUrl}/guilds`);
});
// Get current user info
router.get('/me', (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        res.status(401).json({ authenticated: false });
        return;
    }
    const user = req.user;
    res.json({
        authenticated: true,
        user: {
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            avatar: user.avatar,
        },
    });
});
// Logout
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            res.status(500).json({ error: 'Erreur lors de la déconnexion' });
            return;
        }
        req.session.destroy((err) => {
            if (err) {
                res.status(500).json({ error: 'Erreur lors de la destruction de la session' });
                return;
            }
            res.json({ success: true });
        });
    });
});
export default router;
