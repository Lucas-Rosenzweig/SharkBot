import { describe, it, expect } from 'vitest';
import { progressBar } from '../../../src/utils/progressBar';
import { formatK } from '../../../src/utils/svgHelpers';

describe('progressBar', () => {
    it('returns full bar when current equals max', () => {
        expect(progressBar(100, 100)).toBe('▰▰▰▰▰▰▰▰▰▰');
    });

    it('returns empty bar when current is 0', () => {
        expect(progressBar(0, 100)).toBe('▱▱▱▱▱▱▱▱▱▱');
    });

    it('returns half-filled bar', () => {
        const bar = progressBar(50, 100);
        expect(bar).toBe('▰▰▰▰▰▱▱▱▱▱');
    });

    it('clamps at 100% when current exceeds max', () => {
        expect(progressBar(200, 100)).toBe('▰▰▰▰▰▰▰▰▰▰');
    });

    it('respects custom length', () => {
        const bar = progressBar(50, 100, 20);
        expect(bar.length).toBe(20);
    });

    it('handles length of 1', () => {
        expect(progressBar(50, 100, 1)).toBe('▰');
        expect(progressBar(0, 100, 1)).toBe('▱');
    });
});

describe('formatK (exported from progressBar as formatNumber)', () => {
    it('formats thousands', () => {
        expect(formatK(1500)).toBe('1.5K');
    });

    it('formats millions', () => {
        expect(formatK(2_500_000)).toBe('2.5M');
    });

    it('small numbers returned as-is', () => {
        expect(formatK(42)).toBe('42');
    });
});

