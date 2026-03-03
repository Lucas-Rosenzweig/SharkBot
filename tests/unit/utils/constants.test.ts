import { describe, it, expect } from 'vitest';
import {
    ADMINISTRATOR_PERMISSION,
    VOICE_XP_INTERVAL_MS,
    LEADERBOARD_PAGE_SIZE,
    COLLECTOR_TIMEOUT_MS,
    MAX_TEMPLATE_LENGTH,
    MAX_OUTPUT_LENGTH,
    MAX_ITERATIONS,
    MAX_MATH_EXPR_LENGTH,
    MAX_MATH_DEPTH,
    DEFAULT_LEVEL_UP_MESSAGE,
} from '../../../src/utils/constants';

describe('constants', () => {
    it('ADMINISTRATOR_PERMISSION is 0x8', () => {
        expect(ADMINISTRATOR_PERMISSION).toBe(8);
    });

    it('VOICE_XP_INTERVAL_MS is 60 seconds', () => {
        expect(VOICE_XP_INTERVAL_MS).toBe(60_000);
    });

    it('LEADERBOARD_PAGE_SIZE is 10', () => {
        expect(LEADERBOARD_PAGE_SIZE).toBe(10);
    });

    it('COLLECTOR_TIMEOUT_MS is 2 minutes', () => {
        expect(COLLECTOR_TIMEOUT_MS).toBe(120_000);
    });

    it('MAX_TEMPLATE_LENGTH is 2000', () => {
        expect(MAX_TEMPLATE_LENGTH).toBe(2_000);
    });

    it('MAX_OUTPUT_LENGTH is 4000', () => {
        expect(MAX_OUTPUT_LENGTH).toBe(4_000);
    });

    it('MAX_ITERATIONS is 10', () => {
        expect(MAX_ITERATIONS).toBe(10);
    });

    it('MAX_MATH_EXPR_LENGTH is 100', () => {
        expect(MAX_MATH_EXPR_LENGTH).toBe(100);
    });

    it('MAX_MATH_DEPTH is 20', () => {
        expect(MAX_MATH_DEPTH).toBe(20);
    });

    it('DEFAULT_LEVEL_UP_MESSAGE contains {mention} and {level}', () => {
        expect(DEFAULT_LEVEL_UP_MESSAGE).toContain('{mention}');
        expect(DEFAULT_LEVEL_UP_MESSAGE).toContain('{level}');
    });
});

