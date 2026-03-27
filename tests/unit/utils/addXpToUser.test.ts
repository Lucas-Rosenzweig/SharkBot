import { describe, it, expect } from 'vitest';
import { getXpForNextLevel } from '../../../src/utils/addXpToUser';

describe('getXpForNextLevel', () => {
    it('returns correct XP for level 0', () => {
        // n=1: 5*(1) + 50*1 + 100 = 155
        expect(getXpForNextLevel(0)).toBe(155);
    });

    it('returns correct XP for level 1', () => {
        // n=2: 5*(4) + 50*2 + 100 = 220
        expect(getXpForNextLevel(1)).toBe(220);
    });

    it('returns correct XP for level 2', () => {
        // n=3: 5*(9) + 50*3 + 100 = 295
        expect(getXpForNextLevel(2)).toBe(295);
    });

    it('returns correct XP for level 4', () => {
        // n=5: 5*(25) + 50*5 + 100 = 475
        expect(getXpForNextLevel(4)).toBe(475);
    });

    it('returns correct XP for level 9', () => {
        // n=10: 5*(100) + 50*10 + 100 = 1100
        expect(getXpForNextLevel(9)).toBe(1100);
    });

    it('returns correct XP for level 49', () => {
        // n=50: 5*(2500) + 50*50 + 100 = 15100
        expect(getXpForNextLevel(49)).toBe(15100);
    });

    it('scales quadratically', () => {
        const lvl10 = getXpForNextLevel(10);
        const lvl20 = getXpForNextLevel(20);
        // Level 20 should require significantly more than level 10
        expect(lvl20).toBeGreaterThan(lvl10 * 2);
    });
});

