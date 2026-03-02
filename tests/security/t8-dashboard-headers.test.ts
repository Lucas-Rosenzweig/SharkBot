/**
 * T8 — Dashboard Security Headers (Next.js config validation)
 * Verifies that next.config.ts defines the required security headers.
 * OWASP: A05 Security Misconfiguration
 *
 * Note: We validate the config source code statically because
 * running a full Next.js server in tests would be too heavy.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..', '..');
const nextConfig = readFileSync(resolve(ROOT, 'dashboard', 'next.config.ts'), 'utf-8');

describe('T8 — Headers de sécurité Dashboard (Next.js)', () => {
    it('T8.1 — next.config.ts defines async headers() method', () => {
        expect(nextConfig).toContain('async headers()');
    });

    it('T8.2 — X-Content-Type-Options: nosniff is configured', () => {
        expect(nextConfig).toContain('X-Content-Type-Options');
        expect(nextConfig).toContain('nosniff');
    });

    it('T8.3 — X-Frame-Options: DENY is configured', () => {
        expect(nextConfig).toContain('X-Frame-Options');
        expect(nextConfig).toContain('DENY');
    });

    it('T8.4 — Referrer-Policy is configured', () => {
        expect(nextConfig).toContain('Referrer-Policy');
        expect(nextConfig).toContain('strict-origin-when-cross-origin');
    });

    it('T8.5 — Strict-Transport-Security is configured', () => {
        expect(nextConfig).toContain('Strict-Transport-Security');
        expect(nextConfig).toContain('max-age=31536000');
        expect(nextConfig).toContain('includeSubDomains');
    });

    it('T8.6 — Permissions-Policy is configured', () => {
        expect(nextConfig).toContain('Permissions-Policy');
        expect(nextConfig).toContain('camera=()');
        expect(nextConfig).toContain('microphone=()');
        expect(nextConfig).toContain('geolocation=()');
    });

    it('T8.7 — Headers apply to all routes', () => {
        expect(nextConfig).toContain("source: '/(.*)'");
    });
});

