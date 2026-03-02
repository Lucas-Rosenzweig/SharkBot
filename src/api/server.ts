import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import rateLimit from 'express-rate-limit';
import { Client } from 'discord.js';
import { OAuthUser } from './middleware/auth';
import { doubleCsrfProtection, generateCsrfToken } from './middleware/csrf';

// Routes
import authRouter from './routes/auth';
import configRouter from './routes/config';
import levelRolesRouter from './routes/levelRoles';
import usersRouter from './routes/users';
import { createGuildsRouter } from './routes/guilds';
import { createReactionRolesRouter } from './routes/reactionRoles';

export function startApiServer(client: Client): void {
    const app = express();
    const PORT = process.env.API_PORT || 3001;
    const isProduction = process.env.NODE_ENV === 'production';

    // ── Helmet: security headers ─────────────────────────────
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
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
    }));

    // ── HTTPS redirect in production ─────────────────────────
    if (isProduction) {
        app.use((req, res, next) => {
            if (req.headers['x-forwarded-proto'] !== 'https') {
                return res.redirect(301, `https://${req.headers.host}${req.url}`);
            }
            next();
        });
    }

    // ── Rate limiting (global) ───────────────────────────────
    const limiter = rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(limiter);

    // ── Auth rate limiter (strict) ───────────────────────────
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many authentication attempts, please try again later.',
    });
    app.use('/api/auth/discord', authLimiter);

    // ── CORS ─────────────────────────────────────────────────
    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:5173';
    app.use(cors({
        origin: dashboardUrl,
        credentials: true,
    }));

    // Body parsing
    app.use(express.json());

    // Cookie parser (required by csrf-csrf)
    app.use(cookieParser());

    // Sessions
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
        console.error('[API] SESSION_SECRET must be set');
        return;
    }

    app.use(session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: isProduction,
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: isProduction ? 'none' : 'lax',
        },
    }));

    // Passport
    app.use(passport.initialize());
    app.use(passport.session());

    // Discord OAuth2 Strategy
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const callbackURL = `${process.env.API_URL || 'http://localhost:3001'}/api/auth/discord/callback`;

    if (!clientId || !clientSecret) {
        console.error('[API] DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET must be set');
        return;
    }

    passport.use(new DiscordStrategy(
        {
            clientID: clientId,
            clientSecret: clientSecret,
            callbackURL,
            scope: ['identify', 'guilds'],
        },
        (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
            const user: OAuthUser = {
                id: profile.id,
                username: profile.username,
                discriminator: profile.discriminator,
                avatar: profile.avatar,
                guilds: profile.guilds || [],
                accessToken: _accessToken,
                refreshToken: _refreshToken,
            };
            return done(null, user);
        }
    ));

    passport.serializeUser((user: any, done) => {
        done(null, user);
    });

    passport.deserializeUser((obj: any, done) => {
        done(null, obj);
    });

    // Routes
    app.use('/api/auth', authRouter);

    // ── CSRF protection ──────────────────────────────────────
    // Token endpoint (must come after session/passport init)
    app.get('/api/csrf-token', (req, res) => {
        // Touch the session so it gets saved (required for saveUninitialized: false)
        (req.session as any).csrfInitialized = true;
        const token = generateCsrfToken(req, res);
        res.json({ csrfToken: token });
    });

    // Protect all mutating routes (POST/PUT/PATCH/DELETE)
    app.use('/api/guilds', doubleCsrfProtection);
    app.use('/api/auth/logout', doubleCsrfProtection);

    app.use('/api/guilds', createGuildsRouter(client));
    app.use('/api/guilds/:guildId/config', configRouter);
    app.use('/api/guilds/:guildId/level-roles', levelRolesRouter);
    app.use('/api/guilds/:guildId/reaction-roles', createReactionRolesRouter(client));
    app.use('/api/guilds/:guildId/users', usersRouter);

    // Health check
    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok', bot: client.isReady() ? 'connected' : 'disconnected' });
    });

    app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`[API] Dashboard API running on port ${PORT}`);
    });
}

