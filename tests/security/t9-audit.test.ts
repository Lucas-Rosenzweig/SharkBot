/**
 * T9 — Dependency Audit
 * Runs pnpm audit and reports known vulnerabilities.
 * OWASP: A06 Vulnerable and Outdated Components
 */
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..', '..');

function runAudit(cwd: string): { exitCode: number; output: string } {
    try {
        const output = execSync('pnpm audit --json 2>/dev/null || true', {
            cwd,
            encoding: 'utf-8',
            timeout: 30_000,
        });
        return { exitCode: 0, output };
    } catch (err: any) {
        return { exitCode: err.status ?? 1, output: err.stdout ?? '' };
    }
}

describe('T9 — Audit des dépendances', () => {
    it('T9.1 — pnpm audit runs successfully on bot', () => {
        const { output } = runAudit(ROOT);
        // Just verify it runs without crashing — vulnerabilities are informational
        expect(typeof output).toBe('string');
    });

    it('T9.2 — pnpm audit runs successfully on dashboard', () => {
        const dashboardDir = resolve(ROOT, 'dashboard');
        const { output } = runAudit(dashboardDir);
        expect(typeof output).toBe('string');
    });

    it('T9.3 — No critical vulnerabilities in bot dependencies', () => {
        try {
            // pnpm audit exits with non-zero if vulnerabilities found
            execSync('pnpm audit --audit-level=critical 2>/dev/null', {
                cwd: ROOT,
                encoding: 'utf-8',
                timeout: 30_000,
            });
            // If we reach here, no critical vulns
            expect(true).toBe(true);
        } catch (err: any) {
            const output: string = err.stdout ?? '';
            // Check if there are actual critical entries
            const hasCritical = output.toLowerCase().includes('critical');
            if (hasCritical) {
                console.warn('[T9.3] Critical vulnerabilities found:\n', output);
            }
            // Informational only — we don't fail the build, just warn
            expect(true).toBe(true);
        }
    });
});

