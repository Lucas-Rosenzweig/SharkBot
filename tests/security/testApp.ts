/**
 * Test-only Express app that mirrors the security middleware stack
 * of the real server.ts but WITHOUT Discord/Prisma dependencies.
 *
 * This lets us exercise Helmet, rate-limiting, CSRF, session security,
 * auth guards and Zod validation in pure unit / integration tests.
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { doubleCsrf } from 'csrf-csrf';
import { requireAuth, requireGuildAdmin, OAuthUser } from '../../src/api/middleware/auth';
import { validate, updateConfigSchema, createLevelRoleSchema, createReactionRoleSchema, updateUserSchema } from '../../src/api/validators/schemas';

// ── Test helpers ──────────────────────────────────────────────

const SESSION_SECRET = 'test-secret-for-security-tests-min32chars!!';

const ADMIN_USER: OAuthUser = {
    id: '111111111111111111',
    username: 'TestAdmin',
    discriminator: '0001',
    avatar: null,
    guilds: [
        { id: '999999999999999999', name: 'Test Guild', icon: null, owner: true, permissions: 0x8 },
    ],
    accessToken: 'mock-access',
    refreshToken: 'mock-refresh',
};

const NON_ADMIN_USER: OAuthUser = {
    id: '222222222222222222',
    username: 'TestUser',
    discriminator: '0002',
    avatar: null,
    guilds: [
        { id: '999999999999999999', name: 'Test Guild', icon: null, owner: false, permissions: 0x0 },
    ],
    accessToken: 'mock-access',
    refreshToken: 'mock-refresh',
};

const NON_MEMBER_USER: OAuthUser = {
    id: '333333333333333333',
    username: 'Outsider',
    discriminator: '0003',
    avatar: null,
    guilds: [],
    accessToken: 'mock-access',
    refreshToken: 'mock-refresh',
};

// ── CSRF setup (mirrors src/api/middleware/csrf.ts) ───────────

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
    getSecret: () => SESSION_SECRET,
    getSessionIdentifier: (req: Request) => req.session?.id ?? '',
    cookieName: '__csrf',
    cookieOptions: {
        httpOnly: false,
        sameSite: 'lax',
        secure: false,
        path: '/',
    },
    getCsrfTokenFromRequest: (req: Request) =>
        req.headers['x-csrf-token'] as string,
});

// ── App factory ───────────────────────────────────────────────

export interface TestAppOptions {
    /** Override the global rate limit (default: 100). Set high for non-rate-limit tests. */
    globalRateLimit?: number;
    /** Override the auth rate limit (default: 5). */
    authRateLimit?: number;
    /** Simulate production mode for HTTPS redirect tests. */
    production?: boolean;
}

export function createTestApp(opts: TestAppOptions = {}) {
    const app = express();
    const globalMax = opts.globalRateLimit ?? 100;
    const authMax = opts.authRateLimit ?? 5;

    // ── Helmet ────────────────────────────────────────────────
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https://cdn.discordapp.com'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'", 'data:'],
                objectSrc: ["'none'"],
                frameSrc: ["'none'"],
            },
        },
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    }));

    // ── HTTPS redirect (production only) ──────────────────────
    if (opts.production) {
        app.use((req: Request, res: Response, next: NextFunction) => {
            if (req.headers['x-forwarded-proto'] !== 'https') {
                return res.redirect(301, `https://${req.headers.host}${req.url}`);
            }
            next();
        });
    }

    // ── Rate limiting ─────────────────────────────────────────
    app.use(rateLimit({
        windowMs: 60_000,
        max: globalMax,
        standardHeaders: true,
        legacyHeaders: false,
    }));

    app.use('/api/auth/discord', rateLimit({
        windowMs: 15 * 60_000,
        max: authMax,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many authentication attempts, please try again later.',
    }));

    // ── CORS ──────────────────────────────────────────────────
    app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

    // ── Body parsing + cookie parser ──────────────────────────
    app.use(express.json());
    app.use(cookieParser());

    // ── Session ───────────────────────────────────────────────
    app.use(session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, httpOnly: true, sameSite: 'lax' },
    }));

    // ── Fake passport-like auth via middleware ─────────────────
    // Instead of real passport, we inject a user based on a custom header.
    // X-Test-User: admin | nonadmin | nonmember | (absent = unauthenticated)
    app.use((req: Request, _res: Response, next: NextFunction) => {
        const testUser = req.headers['x-test-user'] as string | undefined;
        if (testUser === 'admin') {
            req.user = ADMIN_USER;
            (req as any).isAuthenticated = () => true;
        } else if (testUser === 'nonadmin') {
            req.user = NON_ADMIN_USER;
            (req as any).isAuthenticated = () => true;
        } else if (testUser === 'nonmember') {
            req.user = NON_MEMBER_USER;
            (req as any).isAuthenticated = () => true;
        }
        // else: no user → unauthenticated
        next();
    });

    // ── Auth mock route (simulates Discord OAuth redirect) ────
    app.get('/api/auth/discord', (_req: Request, res: Response) => {
        res.redirect(302, 'https://discord.com/oauth2/authorize');
    });

    // ── /api/auth/me ──────────────────────────────────────────
    app.get('/api/auth/me', (req: Request, res: Response) => {
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

    // ── CSRF token endpoint ───────────────────────────────────
    app.get('/api/csrf-token', (req: Request, res: Response) => {
        // Touch the session so it gets saved (required for saveUninitialized: false)
        (req.session as any).csrfInitialized = true;
        const token = generateCsrfToken(req, res);
        res.json({ csrfToken: token });
    });

    // ── CSRF protection on mutating routes ────────────────────
    app.use('/api/guilds', doubleCsrfProtection);
    app.use('/api/auth/logout', doubleCsrfProtection);

    // ── /api/auth/logout ──────────────────────────────────────
    app.post('/api/auth/logout', (req: Request, res: Response) => {
        res.json({ success: true });
    });

    // ── Health check ──────────────────────────────────────────
    app.get('/api/health', (_req: Request, res: Response) => {
        res.json({ status: 'ok' });
    });

    // ── Protected guild routes (stubs) ────────────────────────
    const GUILD_ID = '999999999999999999';

    // GET guilds
    app.get('/api/guilds', requireAuth, (_req: Request, res: Response) => {
        res.json([{ id: GUILD_ID, name: 'Test Guild' }]);
    });

    // GET config
    app.get(`/api/guilds/:guildId/config`, requireAuth, requireGuildAdmin, (_req: Request, res: Response) => {
        res.json({ xpCooldown: 60, xpPerMessage: 15, xpPerMinute: 10, voiceXpRequireUnmuted: false });
    });

    // PUT config
    app.put(`/api/guilds/:guildId/config`, requireAuth, requireGuildAdmin, validate(updateConfigSchema), (req: Request, res: Response) => {
        res.json(req.body);
    });

    // GET level-roles
    app.get(`/api/guilds/:guildId/level-roles`, requireAuth, requireGuildAdmin, (_req: Request, res: Response) => {
        res.json([]);
    });

    // POST level-roles
    app.post(`/api/guilds/:guildId/level-roles`, requireAuth, requireGuildAdmin, validate(createLevelRoleSchema), (req: Request, res: Response) => {
        res.status(201).json({ id: 'lr-1', ...req.body, guildId: req.params.guildId });
    });

    // DELETE level-roles
    app.delete(`/api/guilds/:guildId/level-roles/:id`, requireAuth, requireGuildAdmin, (_req: Request, res: Response) => {
        res.json({ success: true });
    });

    // POST reaction-roles
    app.post(`/api/guilds/:guildId/reaction-roles`, requireAuth, requireGuildAdmin, validate(createReactionRoleSchema), (req: Request, res: Response) => {
        res.status(201).json({ id: 'rr-1', ...req.body, guildId: req.params.guildId });
    });

    // DELETE reaction-roles
    app.delete(`/api/guilds/:guildId/reaction-roles/:id`, requireAuth, requireGuildAdmin, (_req: Request, res: Response) => {
        res.json({ success: true });
    });

    // GET users
    app.get(`/api/guilds/:guildId/users`, requireAuth, requireGuildAdmin, (_req: Request, res: Response) => {
        res.json({ users: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } });
    });

    // PUT users/:discordId
    app.put(`/api/guilds/:guildId/users/:discordId`, requireAuth, requireGuildAdmin, validate(updateUserSchema), (req: Request, res: Response) => {
        res.json({ discordId: req.params.discordId, ...req.body });
    });

    return app;
}

export { ADMIN_USER, NON_ADMIN_USER, NON_MEMBER_USER, SESSION_SECRET };


