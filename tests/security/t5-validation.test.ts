/**
 * T5 — Input Validation (Zod)
 * Verifies that all user inputs are validated before reaching handlers.
 * OWASP: A03 Injection
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { type Express } from 'express';
import { createTestApp } from './testApp';
import { authCsrfRequest } from './helpers';

const GUILD_ID = '999999999999999999';
let app: Express;

beforeAll(() => {
    app = createTestApp({ globalRateLimit: 10_000 });
});

describe('T5 — Validation des entrées (Zod)', () => {
    // ── Config (PUT) ──────────────────────────────────────────

    describe('Config', () => {
        it('T5.1 — Rejects string instead of number for xpCooldown', async () => {
            const res = await authCsrfRequest(app, 'put', `/api/guilds/${GUILD_ID}/config`, {
                xpCooldown: 'abc',
            });
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Validation failed');
            expect(res.body.details).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ path: 'xpCooldown' }),
                ]),
            );
        });

        it('T5.2 — Rejects negative xpPerMessage', async () => {
            const res = await authCsrfRequest(app, 'put', `/api/guilds/${GUILD_ID}/config`, {
                xpPerMessage: -5,
            });
            expect(res.status).toBe(400);
            expect(res.body.details).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ path: 'xpPerMessage' }),
                ]),
            );
        });

        it('T5.3 — Rejects zero xpPerMinute', async () => {
            const res = await authCsrfRequest(app, 'put', `/api/guilds/${GUILD_ID}/config`, {
                xpPerMinute: 0,
            });
            expect(res.status).toBe(400);
        });

        it('T5.4 — Rejects invalid snowflake for xpChannelId', async () => {
            const res = await authCsrfRequest(app, 'put', `/api/guilds/${GUILD_ID}/config`, {
                xpChannelId: 'not-a-snowflake',
            });
            expect(res.status).toBe(400);
            expect(res.body.details).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ path: 'xpChannelId' }),
                ]),
            );
        });

        it('T5.5 — Accepts valid snowflake for xpChannelId', async () => {
            const res = await authCsrfRequest(app, 'put', `/api/guilds/${GUILD_ID}/config`, {
                xpChannelId: '123456789012345678',
            });
            expect(res.status).toBe(200);
        });

        it('T5.6 — Accepts empty string for xpChannelId (disable)', async () => {
            const res = await authCsrfRequest(app, 'put', `/api/guilds/${GUILD_ID}/config`, {
                xpChannelId: '',
            });
            expect(res.status).toBe(200);
        });

        it('T5.7 — Accepts null for xpChannelId', async () => {
            const res = await authCsrfRequest(app, 'put', `/api/guilds/${GUILD_ID}/config`, {
                xpChannelId: null,
            });
            expect(res.status).toBe(200);
        });

        it('T5.8 — Rejects non-boolean voiceXpRequireUnmuted', async () => {
            const res = await authCsrfRequest(app, 'put', `/api/guilds/${GUILD_ID}/config`, {
                voiceXpRequireUnmuted: 'yes',
            });
            expect(res.status).toBe(400);
        });

        it('T5.9 — Accepts valid full config', async () => {
            const res = await authCsrfRequest(app, 'put', `/api/guilds/${GUILD_ID}/config`, {
                xpCooldown: 30,
                xpPerMessage: 20,
                xpPerMinute: 10,
                xpChannelId: '123456789012345678',
                voiceXpRequireUnmuted: true,
            });
            expect(res.status).toBe(200);
        });

        it('T5.10 — Strips unknown fields', async () => {
            const res = await authCsrfRequest(app, 'put', `/api/guilds/${GUILD_ID}/config`, {
                xpCooldown: 30,
                malicious: '<script>alert(1)</script>',
            });
            expect(res.status).toBe(200);
            expect(res.body.malicious).toBeUndefined();
        });
    });

    // ── Level Roles (POST) ────────────────────────────────────

    describe('Level Roles', () => {
        it('T5.11 — Rejects empty body', async () => {
            const res = await authCsrfRequest(app, 'post', `/api/guilds/${GUILD_ID}/level-roles`, {});
            expect(res.status).toBe(400);
            expect(res.body.details.length).toBeGreaterThanOrEqual(2);
        });

        it('T5.12 — Rejects snowflake too short', async () => {
            const res = await authCsrfRequest(app, 'post', `/api/guilds/${GUILD_ID}/level-roles`, {
                roleId: '123',
                levelReq: 5,
            });
            expect(res.status).toBe(400);
            expect(res.body.details).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ message: expect.stringContaining('snowflake') }),
                ]),
            );
        });

        it('T5.13 — Rejects snowflake with non-digit characters', async () => {
            const res = await authCsrfRequest(app, 'post', `/api/guilds/${GUILD_ID}/level-roles`, {
                roleId: 'abcdefghijklmnopqr',
                levelReq: 5,
            });
            expect(res.status).toBe(400);
        });

        it('T5.14 — Rejects negative levelReq', async () => {
            const res = await authCsrfRequest(app, 'post', `/api/guilds/${GUILD_ID}/level-roles`, {
                roleId: '123456789012345678',
                levelReq: -1,
            });
            expect(res.status).toBe(400);
        });

        it('T5.15 — Rejects zero levelReq', async () => {
            const res = await authCsrfRequest(app, 'post', `/api/guilds/${GUILD_ID}/level-roles`, {
                roleId: '123456789012345678',
                levelReq: 0,
            });
            expect(res.status).toBe(400);
        });

        it('T5.16 — Rejects float levelReq', async () => {
            const res = await authCsrfRequest(app, 'post', `/api/guilds/${GUILD_ID}/level-roles`, {
                roleId: '123456789012345678',
                levelReq: 5.5,
            });
            expect(res.status).toBe(400);
        });

        it('T5.17 — Accepts valid level role', async () => {
            const res = await authCsrfRequest(app, 'post', `/api/guilds/${GUILD_ID}/level-roles`, {
                roleId: '123456789012345678',
                levelReq: 5,
            });
            expect(res.status).toBe(201);
        });
    });

    // ── Reaction Roles (POST) ─────────────────────────────────

    describe('Reaction Roles', () => {
        it('T5.18 — Rejects missing required fields', async () => {
            const res = await authCsrfRequest(app, 'post', `/api/guilds/${GUILD_ID}/reaction-roles`, {});
            expect(res.status).toBe(400);
        });

        it('T5.19 — Rejects emoji longer than 100 chars', async () => {
            const res = await authCsrfRequest(app, 'post', `/api/guilds/${GUILD_ID}/reaction-roles`, {
                messageId: '123456789012345678',
                emoji: 'A'.repeat(101),
                roleId: '123456789012345678',
            });
            expect(res.status).toBe(400);
        });

        it('T5.20 — Rejects empty emoji', async () => {
            const res = await authCsrfRequest(app, 'post', `/api/guilds/${GUILD_ID}/reaction-roles`, {
                messageId: '123456789012345678',
                emoji: '',
                roleId: '123456789012345678',
            });
            expect(res.status).toBe(400);
        });

        it('T5.21 — Defaults removeOnUnreact to true when omitted', async () => {
            const res = await authCsrfRequest(app, 'post', `/api/guilds/${GUILD_ID}/reaction-roles`, {
                messageId: '123456789012345678',
                emoji: '⭐',
                roleId: '123456789012345678',
            });
            expect(res.status).toBe(201);
            expect(res.body.removeOnUnreact).toBe(true);
        });

        it('T5.22 — Accepts valid reaction role with removeOnUnreact=false', async () => {
            const res = await authCsrfRequest(app, 'post', `/api/guilds/${GUILD_ID}/reaction-roles`, {
                messageId: '123456789012345678',
                emoji: '🎉',
                roleId: '987654321098765432',
                removeOnUnreact: false,
            });
            expect(res.status).toBe(201);
            expect(res.body.removeOnUnreact).toBe(false);
        });
    });

    // ── Users (PUT) ───────────────────────────────────────────

    describe('Users', () => {
        it('T5.23 — Rejects negative xpTotal', async () => {
            const res = await authCsrfRequest(app, 'put', `/api/guilds/${GUILD_ID}/users/111111111111111111`, {
                xpTotal: -100,
            });
            expect(res.status).toBe(400);
        });

        it('T5.24 — Rejects level 0', async () => {
            const res = await authCsrfRequest(app, 'put', `/api/guilds/${GUILD_ID}/users/111111111111111111`, {
                level: 0,
            });
            expect(res.status).toBe(400);
        });

        it('T5.25 — Rejects float level', async () => {
            const res = await authCsrfRequest(app, 'put', `/api/guilds/${GUILD_ID}/users/111111111111111111`, {
                level: 3.7,
            });
            expect(res.status).toBe(400);
        });

        it('T5.26 — Accepts valid user update', async () => {
            const res = await authCsrfRequest(app, 'put', `/api/guilds/${GUILD_ID}/users/111111111111111111`, {
                level: 10,
                xpTotal: 5000,
            });
            expect(res.status).toBe(200);
        });

        it('T5.27 — Accepts empty body (all optional)', async () => {
            const res = await authCsrfRequest(app, 'put', `/api/guilds/${GUILD_ID}/users/111111111111111111`, {});
            expect(res.status).toBe(200);
        });

        it('T5.28 — Strips unknown fields from body', async () => {
            const res = await authCsrfRequest(app, 'put', `/api/guilds/${GUILD_ID}/users/111111111111111111`, {
                level: 5,
                isAdmin: true,
                role: 'superuser',
            });
            expect(res.status).toBe(200);
            expect(res.body.isAdmin).toBeUndefined();
            expect(res.body.role).toBeUndefined();
        });
    });
});

