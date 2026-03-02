/**
 * T2 — HTTPS Redirect
 * Verifies HTTP → HTTPS redirection in production mode.
 * OWASP: A02 Cryptographic Failures
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './testApp';

describe('T2 — Redirection HTTPS', () => {
    it('T2.1 — Redirects HTTP to HTTPS in production mode', async () => {
        const prodApp = createTestApp({ production: true, globalRateLimit: 10_000 });

        const res = await request(prodApp)
            .get('/api/health')
            .set('x-forwarded-proto', 'http')
            .set('Host', 'example.com');

        expect(res.status).toBe(301);
        expect(res.headers['location']).toContain('https://example.com');
    });

    it('T2.2 — Does NOT redirect when x-forwarded-proto is https in production', async () => {
        const prodApp = createTestApp({ production: true, globalRateLimit: 10_000 });

        const res = await request(prodApp)
            .get('/api/health')
            .set('x-forwarded-proto', 'https');

        expect(res.status).toBe(200);
    });

    it('T2.3 — Does NOT redirect in development mode (default)', async () => {
        const devApp = createTestApp({ globalRateLimit: 10_000 });

        const res = await request(devApp)
            .get('/api/health')
            .set('x-forwarded-proto', 'http');

        expect(res.status).toBe(200);
    });

    it('T2.4 — HSTS header is always present (even in dev)', async () => {
        const devApp = createTestApp({ globalRateLimit: 10_000 });
        const res = await request(devApp).get('/api/health');
        expect(res.headers['strict-transport-security']).toContain('max-age=31536000');
    });
});

