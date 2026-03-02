/**
 * T3 — Rate Limiting
 * Verifies global and auth-specific rate limits.
 * OWASP: A05 Security Misconfiguration
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './testApp';

describe('T3 — Rate Limiting', () => {
    it('T3.1 — Global rate limit returns 429 after exceeding max', async () => {
        // Use a low limit so the test runs quickly
        const app = createTestApp({ globalRateLimit: 3 });

        // First 3 requests should succeed
        for (let i = 0; i < 3; i++) {
            const res = await request(app).get('/api/health');
            expect(res.status).toBe(200);
        }

        // 4th request should be rate-limited
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(429);
    });

    it('T3.2 — Auth rate limit is stricter than global', async () => {
        // authRateLimit=2 means only 2 auth requests allowed per window
        const app = createTestApp({ globalRateLimit: 10_000, authRateLimit: 2 });

        for (let i = 0; i < 2; i++) {
            const res = await request(app).get('/api/auth/discord');
            // Should redirect to Discord (302)
            expect(res.status).toBe(302);
        }

        // 3rd auth request should be rate-limited
        const res = await request(app).get('/api/auth/discord');
        expect(res.status).toBe(429);
    });

    it('T3.3 — RateLimit standard headers are present', async () => {
        const app = createTestApp({ globalRateLimit: 100 });
        const res = await request(app).get('/api/health');

        expect(res.headers['ratelimit-limit']).toBeDefined();
        expect(res.headers['ratelimit-remaining']).toBeDefined();
        expect(res.headers['ratelimit-reset']).toBeDefined();
    });

    it('T3.4 — Legacy X-RateLimit headers are NOT present', async () => {
        const app = createTestApp({ globalRateLimit: 100 });
        const res = await request(app).get('/api/health');

        expect(res.headers['x-ratelimit-limit']).toBeUndefined();
        expect(res.headers['x-ratelimit-remaining']).toBeUndefined();
    });
});

