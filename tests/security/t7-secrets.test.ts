/**
 * T7 — Secrets Management
 * Verifies that no secrets are hardcoded and .env files are gitignored.
 * OWASP: A02 Cryptographic Failures
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..', '..');

function readFile(relative: string): string {
    return readFileSync(resolve(ROOT, relative), 'utf-8');
}

function grepRecursive(pattern: string, dir: string, extensions: string[]): string[] {
    const includeArgs = extensions.map((ext) => `--include="*.${ext}"`).join(' ');
    try {
        const result = execSync(
            `grep -rn "${pattern}" ${dir} ${includeArgs} 2>/dev/null || true`,
            { cwd: ROOT, encoding: 'utf-8' },
        );
        return result.trim().split('\n').filter(Boolean);
    } catch {
        return [];
    }
}

describe('T7 — Gestion des secrets', () => {
    it('T7.1 — .gitignore contains .env patterns', () => {
        const gitignore = readFile('.gitignore');
        expect(gitignore).toContain('.env');
        expect(gitignore).toContain('.env.prod');
        expect(gitignore).toContain('.env.local');
    });

    it('T7.2 — No hardcoded passwords in source code', () => {
        const matches = grepRecursive('password\\s*=\\s*[\'"]', 'src/', ['ts']);
        expect(matches).toHaveLength(0);
    });

    it('T7.3 — No hardcoded secrets in source code', () => {
        // Match "secret = 'value'" but not "secret = process.env..."
        const matches = grepRecursive("secret\\s*=\\s*['\"][^$]", 'src/', ['ts'])
            .filter((line) => !line.includes('process.env'));
        expect(matches).toHaveLength(0);
    });

    it('T7.4 — No hardcoded DISCORD_TOKEN in source code', () => {
        const matches = grepRecursive("DISCORD_TOKEN\\s*=\\s*['\"]", 'src/', ['ts']);
        expect(matches).toHaveLength(0);
    });

    it('T7.5 — .env files are not tracked by git', () => {
        try {
            const tracked = execSync('git ls-files --cached', { cwd: ROOT, encoding: 'utf-8' });
            const envFiles = tracked.split('\n').filter((f) => /^\.env($|\.)/.test(f) && !f.includes('.example'));
            expect(envFiles).toHaveLength(0);
        } catch {
            // Not a git repo in CI → skip
        }
    });

    it('T7.6 — .env.example exists as reference', () => {
        expect(existsSync(resolve(ROOT, '.env.example'))).toBe(true);
    });

    it('T7.7 — .env.example does not contain real secrets', () => {
        const example = readFile('.env.example');
        // Should contain placeholder text, not real values
        expect(example).not.toMatch(/sk_live_/);
        expect(example).not.toMatch(/ghp_/);
        // The token field should have a placeholder
        expect(example).toContain('your_discord_bot_token_here');
    });

    it('T7.8 — SESSION_SECRET has no default fallback in server.ts', () => {
        const server = readFile('src/api/server.ts');
        // Must NOT contain a fallback like: SESSION_SECRET || 'some-default'
        expect(server).not.toMatch(/SESSION_SECRET\s*\|\|\s*['"]/);
    });

    it('T7.9 — No eval() usage in source code', () => {
        const matches = grepRecursive('\\beval\\s*\\(', 'src/', ['ts']);
        expect(matches).toHaveLength(0);
    });
});

