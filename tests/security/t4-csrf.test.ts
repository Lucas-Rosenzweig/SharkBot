/**
 * T4 — CSRF Protection
 * Verifies double-submit cookie CSRF protection via csrf-csrf.
 * OWASP: A08 Data Integrity Failures
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { type Express } from 'express';
import { createTestApp } from './testApp';
import { createAgent, getCsrf } from './helpers';

const GUILD_ID = '999999999999999999';
let app: Express;

beforeAll(() => {
    app = createTestApp({ globalRateLimit: 10_000 });
});

describe('T4 — Protection CSRF', () => {
    it('T4.1 — GET /api/csrf-token returns a token and sets __csrf cookie', async () => {
        const agent = createAgent(app);
        const res = await agent
            .get('/api/csrf-token')
            .set('x-test-user', 'admin');

        expect(res.status).toBe(200);
        expect(res.body.csrfToken).toBeDefined();
        expect(typeof res.body.csrfToken).toBe('string');
        expect(res.body.csrfToken.length).toBeGreaterThan(0);

        // Check __csrf cookie is set
        const cookies = res.headers['set-cookie'];
        const csrfCookie = (Array.isArray(cookies) ? cookies : [cookies])
            .find((c: string) => c.startsWith('__csrf='));
        expect(csrfCookie).toBeDefined();
    });

    it('T4.2 — POST without CSRF token is rejected with 403', async () => {
        const res = await request(app)
            .post(`/api/guilds/${GUILD_ID}/level-roles`)
            .set('x-test-user', 'admin')
            .set('Content-Type', 'application/json')
            .send({ roleId: '123456789012345678', levelReq: 5 });

        expect(res.status).toBe(403);
    });

    it('T4.3 — POST with invalid CSRF token is rejected with 403', async () => {
        const agent = createAgent(app);

        // Get a valid session + csrf cookie
        await agent.get('/api/csrf-token').set('x-test-user', 'admin');

        // Send with invalid token
        const res = await agent
            .post(`/api/guilds/${GUILD_ID}/level-roles`)
            .set('x-test-user', 'admin')
            .set('x-csrf-token', 'totally-invalid-token')
            .set('Content-Type', 'application/json')
            .send({ roleId: '123456789012345678', levelReq: 5 });

        expect(res.status).toBe(403);
    });

    it('T4.4 — POST with valid CSRF token is accepted', async () => {
        const agent = createAgent(app);

        const csrfRes = await agent.get('/api/csrf-token').set('x-test-user', 'admin');
        const token = csrfRes.body.csrfToken;

        const res = await agent
            .post(`/api/guilds/${GUILD_ID}/level-roles`)
            .set('x-test-user', 'admin')
            .set('x-csrf-token', token)
            .set('Content-Type', 'application/json')
            .send({ roleId: '123456789012345678', levelReq: 5 });

        expect(res.status).toBe(201);
    });

    it('T4.5 — PUT with valid CSRF token is accepted', async () => {
        const agent = createAgent(app);

        const csrfRes = await agent.get('/api/csrf-token').set('x-test-user', 'admin');
        const token = csrfRes.body.csrfToken;

        const res = await agent
            .put(`/api/guilds/${GUILD_ID}/config`)
            .set('x-test-user', 'admin')
            .set('x-csrf-token', token)
            .set('Content-Type', 'application/json')
            .send({ xpCooldown: 30 });

        expect(res.status).toBe(200);
    });

    it('T4.6 — DELETE without CSRF token is rejected', async () => {
        const res = await request(app)
            .delete(`/api/guilds/${GUILD_ID}/level-roles/some-id`)
            .set('x-test-user', 'admin');

        expect(res.status).toBe(403);
    });

    it('T4.7 — DELETE with valid CSRF token is accepted', async () => {
        const agent = createAgent(app);

        const csrfRes = await agent.get('/api/csrf-token').set('x-test-user', 'admin');
        const token = csrfRes.body.csrfToken;

        const res = await agent
            .delete(`/api/guilds/${GUILD_ID}/level-roles/some-id`)
            .set('x-test-user', 'admin')
            .set('x-csrf-token', token);

        expect(res.status).toBe(200);
    });

    it('T4.8 — GET requests are NOT protected by CSRF', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
    });

    it('T4.9 — POST logout without CSRF is rejected', async () => {
        const res = await request(app)
            .post('/api/auth/logout')
            .set('x-test-user', 'admin');

        expect(res.status).toBe(403);
    });

    it('T4.10 — POST logout with valid CSRF is accepted', async () => {
        const agent = createAgent(app);

        const csrfRes = await agent.get('/api/csrf-token').set('x-test-user', 'admin');
        const token = csrfRes.body.csrfToken;

        const res = await agent
            .post('/api/auth/logout')
            .set('x-test-user', 'admin')
            .set('x-csrf-token', token);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});


