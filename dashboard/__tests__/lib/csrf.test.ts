import { describe, it, expect, beforeEach } from 'vitest';
import { getCsrfToken, csrfHeaders } from '../../lib/csrf';

describe('csrf helpers', () => {
    beforeEach(() => {
        // Reset cookies
        Object.defineProperty(document, 'cookie', {
            writable: true,
            value: '',
        });
    });

    describe('getCsrfToken', () => {
        it('returns empty string when no csrf cookie', () => {
            expect(getCsrfToken()).toBe('');
        });

        it('returns token from __csrf cookie', () => {
            document.cookie = '__csrf=test-token-123';
            expect(getCsrfToken()).toBe('test-token-123');
        });

        it('returns token when multiple cookies exist', () => {
            document.cookie = 'other=value; __csrf=my-csrf-token; session=abc';
            expect(getCsrfToken()).toBe('my-csrf-token');
        });

        it('decodes URI-encoded token', () => {
            document.cookie = '__csrf=token%20with%20spaces';
            expect(getCsrfToken()).toBe('token with spaces');
        });
    });

    describe('csrfHeaders', () => {
        it('includes x-csrf-token header', () => {
            document.cookie = '__csrf=abc123';
            const headers = csrfHeaders();
            expect(headers['x-csrf-token']).toBe('abc123');
        });

        it('merges extra headers', () => {
            document.cookie = '__csrf=abc123';
            const headers = csrfHeaders({ 'Content-Type': 'application/json' });
            expect(headers['x-csrf-token']).toBe('abc123');
            expect(headers['Content-Type']).toBe('application/json');
        });

        it('extra headers override defaults if same key', () => {
            document.cookie = '__csrf=abc123';
            const headers = csrfHeaders({ 'x-csrf-token': 'override' });
            expect(headers['x-csrf-token']).toBe('override');
        });
    });
});

