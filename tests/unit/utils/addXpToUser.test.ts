import { describe, it, expect } from 'vitest';
import { getXpForNextLevel } from '../../../src/utils/addXpToUser';

describe('getXpForNextLevel', () => {
    it('returns correct XP for level 1', () => {
        // 5*(1^2) + 50*1 + 100 = 5 + 50 + 100 = 155
        expect(getXpForNextLevel(1)).toBe(155);
    });

    it('returns correct XP for level 2', () => {
        // 5*(4) + 50*2 + 100 = 20 + 100 + 100 = 220
        expect(getXpForNextLevel(2)).toBe(220);
    });

    it('returns correct XP for level 5', () => {
        // 5*(25) + 50*5 + 100 = 125 + 250 + 100 = 475
        expect(getXpForNextLevel(5)).toBe(475);
    });

    it('returns correct XP for level 10', () => {
        // 5*(100) + 50*10 + 100 = 500 + 500 + 100 = 1100
        expect(getXpForNextLevel(10)).toBe(1100);
    });

    it('returns correct XP for level 50', () => {
        // 5*(2500) + 50*50 + 100 = 12500 + 2500 + 100 = 15100
        expect(getXpForNextLevel(50)).toBe(15100);
    });

    it('scales quadratically', () => {
        const lvl10 = getXpForNextLevel(10);
        const lvl20 = getXpForNextLevel(20);
        // Level 20 should require significantly more than level 10
        expect(lvl20).toBeGreaterThan(lvl10 * 2);
    });
});

