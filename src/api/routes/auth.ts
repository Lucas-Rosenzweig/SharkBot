import { Router, Request, Response } from 'express';
import passport from 'passport';
import { OAuthUser } from '../middleware/auth';

const router = Router();

// Redirect to Discord OAuth2
router.get('/discord', passport.authenticate('discord', {
    scope: ['identify', 'guilds'],
}));

// OAuth2 callback
router.get('/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/login' }),
    (_req: Request, res: Response) => {
        const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:5173';
        res.redirect(`${dashboardUrl}/guilds`);
    }
);

// Get current user info
router.get('/me', (req: Request, res: Response) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
        res.status(401).json({ authenticated: false });
        return;
    }

    const user = req.user as OAuthUser;
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
router.post('/logout', (req: Request, res: Response) => {
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

