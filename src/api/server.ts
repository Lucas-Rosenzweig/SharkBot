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
import { createLogger } from '../utils/logger';

// Routes
import authRouter from './routes/auth';
import configRouter from './routes/config';
import levelRolesRouter from './routes/levelRoles';
import usersRouter from './routes/users';
import { createGuildsRouter } from './routes/guilds';
import { createReactionRolesRouter } from './routes/reactionRoles';
import eventsRouter from './routes/events';

const logger = createLogger('API');

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
    app.use(rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
    }));

    // ── Auth rate limiter (strict) ───────────────────────────
    app.use('/api/auth/discord', rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many authentication attempts, please try again later.',
    }));

    // ── CORS ─────────────────────────────────────────────────
    const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:5173';
    app.use(cors({ origin: dashboardUrl, credentials: true }));

    app.use(express.json());
    app.use(cookieParser());

    // Sessions
    const sessionSecret = process.env.SESSION_SECRET;
    if (!sessionSecret) {
        logger.error('SESSION_SECRET must be set');
        return;
    }

    app.use(session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: isProduction,
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
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
        logger.error('DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET must be set');
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

    passport.serializeUser<OAuthUser>((user, done) => {
        done(null, user as OAuthUser);
    });

    passport.deserializeUser<OAuthUser>((obj, done) => {
        done(null, obj);
    });

    // Routes
    app.use('/api/auth', authRouter);

    // ── SSE events route (before CSRF, GET-only) ──────────────
    app.use('/api/guilds/:guildId/events', eventsRouter);

    // ── CSRF protection ──────────────────────────────────────
    app.get('/api/csrf-token', (req, res) => {
        (req.session as any).csrfInitialized = true;
        const token = generateCsrfToken(req, res);
        res.json({ csrfToken: token });
    });

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
        logger.info({ port: PORT }, 'Dashboard API running');
    });
}

