/**
 * T1 — Security Headers (Helmet)
 * Verifies that Helmet headers are present on all API responses.
 * OWASP: A05 Security Misconfiguration
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { type Express } from 'express';
import { createTestApp } from './testApp';

let app: Express;

beforeAll(() => {
    app = createTestApp({ globalRateLimit: 10_000 });
});

describe('T1 — Headers de sécurité (Helmet)', () => {
    it('T1.1 — Content-Security-Policy is present with correct directives', async () => {
        const res = await request(app).get('/api/health');
        const csp = res.headers['content-security-policy'];
        expect(csp).toBeDefined();
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("script-src 'self'");
        expect(csp).toContain("object-src 'none'");
        expect(csp).toContain("frame-src 'none'");
        expect(csp).toContain('https://cdn.discordapp.com');
    });

    it('T1.2 — Strict-Transport-Security is present', async () => {
        const res = await request(app).get('/api/health');
        const hsts = res.headers['strict-transport-security'];
        expect(hsts).toBeDefined();
        expect(hsts).toContain('max-age=31536000');
        expect(hsts).toContain('includeSubDomains');
        expect(hsts).toContain('preload');
    });

    it('T1.3 — X-Content-Type-Options is nosniff', async () => {
        const res = await request(app).get('/api/health');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('T1.4 — X-Frame-Options is present', async () => {
        const res = await request(app).get('/api/health');
        expect(res.headers['x-frame-options']).toBeDefined();
    });

    it('T1.5 — X-Powered-By is removed', async () => {
        const res = await request(app).get('/api/health');
        expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('T1.6 — X-DNS-Prefetch-Control is set', async () => {
        const res = await request(app).get('/api/health');
        expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    });

    it('T1.7 — Security headers are present on protected routes too', async () => {
        const res = await request(app).get('/api/guilds');
        expect(res.headers['content-security-policy']).toBeDefined();
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-powered-by']).toBeUndefined();
    });
});

