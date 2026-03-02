/**
 * T6 — Authentication & Access Control
 * Verifies auth guards and permission checks on all protected routes.
 * OWASP: A01 Broken Access Control, A07 Authentication Failures
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { type Express } from 'express';
import { createTestApp } from './testApp';

const GUILD_ID = '999999999999999999';
let app: Express;

beforeAll(() => {
    app = createTestApp({ globalRateLimit: 10_000 });
});

describe('T6 — Authentification & Contrôle d\'accès', () => {
    // ── Unauthenticated access → 401 ─────────────────────────

    describe('Unauthenticated → 401', () => {
        it('T6.1 — GET /api/guilds without auth', async () => {
            const res = await request(app).get('/api/guilds');
            expect(res.status).toBe(401);
            expect(res.body.error).toBe('Non authentifié');
        });

        it('T6.2 — GET /api/guilds/:guildId/config without auth', async () => {
            const res = await request(app).get(`/api/guilds/${GUILD_ID}/config`);
            expect(res.status).toBe(401);
        });

        it('T6.3 — GET /api/guilds/:guildId/level-roles without auth', async () => {
            const res = await request(app).get(`/api/guilds/${GUILD_ID}/level-roles`);
            expect(res.status).toBe(401);
        });

        it('T6.4 — GET /api/guilds/:guildId/users without auth', async () => {
            const res = await request(app).get(`/api/guilds/${GUILD_ID}/users`);
            expect(res.status).toBe(401);
        });
    });

    // ── Non-admin access → 403 ───────────────────────────────

    describe('Non-admin → 403', () => {
        it('T6.5 — Non-admin user cannot access guild config', async () => {
            const res = await request(app)
                .get(`/api/guilds/${GUILD_ID}/config`)
                .set('x-test-user', 'nonadmin');

            expect(res.status).toBe(403);
            expect(res.body.error).toContain('administrateur');
        });

        it('T6.6 — Non-admin user cannot access level-roles', async () => {
            const res = await request(app)
                .get(`/api/guilds/${GUILD_ID}/level-roles`)
                .set('x-test-user', 'nonadmin');

            expect(res.status).toBe(403);
        });

        it('T6.7 — Non-admin user cannot access users', async () => {
            const res = await request(app)
                .get(`/api/guilds/${GUILD_ID}/users`)
                .set('x-test-user', 'nonadmin');

            expect(res.status).toBe(403);
        });
    });

    // ── Non-member access → 403 ──────────────────────────────

    describe('Non-member → 403', () => {
        it('T6.8 — User not in guild cannot access config', async () => {
            const res = await request(app)
                .get(`/api/guilds/${GUILD_ID}/config`)
                .set('x-test-user', 'nonmember');

            expect(res.status).toBe(403);
            expect(res.body.error).toContain('membre');
        });
    });

    // ── Admin access → 200 ───────────────────────────────────

    describe('Admin → 200', () => {
        it('T6.9 — Admin user can access guild config', async () => {
            const res = await request(app)
                .get(`/api/guilds/${GUILD_ID}/config`)
                .set('x-test-user', 'admin');

            expect(res.status).toBe(200);
            expect(res.body.xpCooldown).toBeDefined();
        });

        it('T6.10 — Admin user can access guilds list', async () => {
            const res = await request(app)
                .get('/api/guilds')
                .set('x-test-user', 'admin');

            expect(res.status).toBe(200);
        });
    });

    // ── /api/auth/me ──────────────────────────────────────────

    describe('/api/auth/me', () => {
        it('T6.11 — Returns 401 without session', async () => {
            const res = await request(app).get('/api/auth/me');
            expect(res.status).toBe(401);
            expect(res.body.authenticated).toBe(false);
        });

        it('T6.12 — Returns filtered user data (no tokens/guilds leaked)', async () => {
            const res = await request(app)
                .get('/api/auth/me')
                .set('x-test-user', 'admin');

            expect(res.status).toBe(200);
            expect(res.body.authenticated).toBe(true);
            expect(res.body.user.id).toBeDefined();
            expect(res.body.user.username).toBeDefined();

            // Sensitive fields MUST NOT be present
            expect(res.body.user.accessToken).toBeUndefined();
            expect(res.body.user.refreshToken).toBeUndefined();
            expect(res.body.user.guilds).toBeUndefined();
        });
    });

    // ── Unknown guild → 403 ──────────────────────────────────

    describe('Unknown guild', () => {
        it('T6.13 — Admin cannot access a guild they are not member of', async () => {
            const unknownGuildId = '888888888888888888';
            const res = await request(app)
                .get(`/api/guilds/${unknownGuildId}/config`)
                .set('x-test-user', 'admin');

            expect(res.status).toBe(403);
        });
    });
});

