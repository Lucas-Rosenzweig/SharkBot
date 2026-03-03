import { describe, it, expect } from 'vitest';
import { escapeXml, formatK, truncateUsername } from '../../../src/utils/svgHelpers';

describe('svgHelpers', () => {
    describe('escapeXml', () => {
        it('escapes < and > characters', () => {
            expect(escapeXml('<script>alert("xss")</script>')).toBe(
                '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
            );
        });

        it('escapes & character', () => {
            expect(escapeXml('Tom & Jerry')).toBe('Tom &amp; Jerry');
        });

        it('escapes single and double quotes', () => {
            expect(escapeXml("it's a \"test\"")).toBe("it&apos;s a &quot;test&quot;");
        });

        it('returns plain string unchanged', () => {
            expect(escapeXml('hello world')).toBe('hello world');
        });

        it('handles empty string', () => {
            expect(escapeXml('')).toBe('');
        });

        it('handles multiple special chars in a row', () => {
            expect(escapeXml('<<>>')).toBe('&lt;&lt;&gt;&gt;');
        });
    });

    describe('formatK', () => {
        it('formats millions with M suffix', () => {
            expect(formatK(1_500_000)).toBe('1.5M');
        });

        it('formats thousands with K suffix', () => {
            expect(formatK(2_500)).toBe('2.5K');
        });

        it('formats exact thousands', () => {
            expect(formatK(1_000)).toBe('1.0K');
        });

        it('returns small numbers as-is', () => {
            expect(formatK(999)).toBe('999');
        });

        it('formats zero', () => {
            expect(formatK(0)).toBe('0');
        });

        it('formats exact million', () => {
            expect(formatK(1_000_000)).toBe('1.0M');
        });
    });

    describe('truncateUsername', () => {
        it('returns short name unchanged', () => {
            expect(truncateUsername('Alice')).toBe('Alice');
        });

        it('truncates long name with ellipsis', () => {
            const long = 'VeryLongUsername123';
            const result = truncateUsername(long);
            expect(result.length).toBeLessThanOrEqual(16);
            expect(result).toContain('…');
        });

        it('handles exactly max length', () => {
            const exact16 = 'ExactlySixteenC';  // 15 chars — should NOT truncate
            expect(exact16.length).toBe(15);
            expect(truncateUsername(exact16)).toBe(exact16);

            const over16 = 'ExactlySixteenCh'; // 16 chars — should NOT truncate (=maxLength)
            expect(over16.length).toBe(16);
            expect(truncateUsername(over16)).toBe(over16);

            const over17 = 'ExactlySeventeenC'; // 17 chars — SHOULD truncate
            expect(over17.length).toBe(17);
            expect(truncateUsername(over17).endsWith('…')).toBe(true);
        });

        it('respects custom maxLength', () => {
            expect(truncateUsername('Hello World', 8)).toBe('Hello …');
        });
    });
});


