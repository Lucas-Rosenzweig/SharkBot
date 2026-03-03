import { describe, it, expect } from 'vitest';
import {
    updateConfigSchema,
    createLevelRoleSchema,
    createReactionRoleSchema,
    updateUserSchema,
} from '../../../src/api/validators/schemas';

describe('Zod validation schemas', () => {
    describe('updateConfigSchema', () => {
        it('accepts valid config', () => {
            const result = updateConfigSchema.safeParse({
                xpCooldown: 20,
                xpPerMessage: 15,
                xpPerMinute: 5,
            });
            expect(result.success).toBe(true);
        });

        it('accepts empty object (all optional)', () => {
            expect(updateConfigSchema.safeParse({}).success).toBe(true);
        });

        it('rejects string for xpCooldown', () => {
            const result = updateConfigSchema.safeParse({ xpCooldown: 'abc' });
            expect(result.success).toBe(false);
        });

        it('rejects negative xpPerMessage', () => {
            const result = updateConfigSchema.safeParse({ xpPerMessage: -5 });
            expect(result.success).toBe(false);
        });

        it('rejects zero xpPerMinute', () => {
            const result = updateConfigSchema.safeParse({ xpPerMinute: 0 });
            expect(result.success).toBe(false);
        });

        it('accepts valid snowflake for xpChannelId', () => {
            const result = updateConfigSchema.safeParse({ xpChannelId: '123456789012345678' });
            expect(result.success).toBe(true);
        });

        it('rejects invalid snowflake for xpChannelId', () => {
            const result = updateConfigSchema.safeParse({ xpChannelId: 'not-a-snowflake' });
            expect(result.success).toBe(false);
        });

        it('accepts empty string for xpChannelId (disable)', () => {
            const result = updateConfigSchema.safeParse({ xpChannelId: '' });
            expect(result.success).toBe(true);
        });

        it('accepts null for xpChannelId', () => {
            const result = updateConfigSchema.safeParse({ xpChannelId: null });
            expect(result.success).toBe(true);
        });

        it('accepts boolean for voiceXpRequireUnmuted', () => {
            const result = updateConfigSchema.safeParse({ voiceXpRequireUnmuted: true });
            expect(result.success).toBe(true);
        });

        it('accepts string for levelUpMessage', () => {
            const result = updateConfigSchema.safeParse({ levelUpMessage: 'GG {user}!' });
            expect(result.success).toBe(true);
        });

        it('accepts null for levelUpMessage', () => {
            const result = updateConfigSchema.safeParse({ levelUpMessage: null });
            expect(result.success).toBe(true);
        });

        it('rejects levelUpMessage over 2000 chars', () => {
            const result = updateConfigSchema.safeParse({ levelUpMessage: 'a'.repeat(2001) });
            expect(result.success).toBe(false);
        });
    });

    describe('createLevelRoleSchema', () => {
        it('accepts valid level role', () => {
            const result = createLevelRoleSchema.safeParse({
                roleId: '123456789012345678',
                levelReq: 5,
            });
            expect(result.success).toBe(true);
        });

        it('rejects missing roleId', () => {
            const result = createLevelRoleSchema.safeParse({ levelReq: 5 });
            expect(result.success).toBe(false);
        });

        it('rejects missing levelReq', () => {
            const result = createLevelRoleSchema.safeParse({ roleId: '123456789012345678' });
            expect(result.success).toBe(false);
        });

        it('rejects zero levelReq', () => {
            const result = createLevelRoleSchema.safeParse({
                roleId: '123456789012345678',
                levelReq: 0,
            });
            expect(result.success).toBe(false);
        });

        it('rejects negative levelReq', () => {
            const result = createLevelRoleSchema.safeParse({
                roleId: '123456789012345678',
                levelReq: -1,
            });
            expect(result.success).toBe(false);
        });

        it('rejects invalid snowflake roleId', () => {
            const result = createLevelRoleSchema.safeParse({
                roleId: 'bad',
                levelReq: 5,
            });
            expect(result.success).toBe(false);
        });
    });

    describe('createReactionRoleSchema', () => {
        it('accepts valid reaction role', () => {
            const result = createReactionRoleSchema.safeParse({
                messageId: '123456789012345678',
                emoji: '🎉',
                roleId: '123456789012345678',
                removeOnUnreact: true,
            });
            expect(result.success).toBe(true);
        });

        it('defaults removeOnUnreact to true', () => {
            const result = createReactionRoleSchema.safeParse({
                messageId: '123456789012345678',
                emoji: '🎉',
                roleId: '123456789012345678',
            });
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.removeOnUnreact).toBe(true);
            }
        });

        it('rejects empty emoji', () => {
            const result = createReactionRoleSchema.safeParse({
                messageId: '123456789012345678',
                emoji: '',
                roleId: '123456789012345678',
            });
            expect(result.success).toBe(false);
        });

        it('rejects missing messageId', () => {
            const result = createReactionRoleSchema.safeParse({
                emoji: '🎉',
                roleId: '123456789012345678',
            });
            expect(result.success).toBe(false);
        });

        it('accepts custom Discord emoji format', () => {
            const result = createReactionRoleSchema.safeParse({
                messageId: '123456789012345678',
                emoji: '<:custom:123456789012345678>',
                roleId: '123456789012345678',
            });
            expect(result.success).toBe(true);
        });
    });

    describe('updateUserSchema', () => {
        it('accepts valid user update', () => {
            const result = updateUserSchema.safeParse({ level: 5, xpTotal: 1000 });
            expect(result.success).toBe(true);
        });

        it('accepts partial update (level only)', () => {
            const result = updateUserSchema.safeParse({ level: 3 });
            expect(result.success).toBe(true);
        });

        it('accepts partial update (xpTotal only)', () => {
            const result = updateUserSchema.safeParse({ xpTotal: 500 });
            expect(result.success).toBe(true);
        });

        it('accepts empty object', () => {
            expect(updateUserSchema.safeParse({}).success).toBe(true);
        });

        it('rejects level less than 1', () => {
            const result = updateUserSchema.safeParse({ level: 0 });
            expect(result.success).toBe(false);
        });

        it('rejects negative xpTotal', () => {
            const result = updateUserSchema.safeParse({ xpTotal: -10 });
            expect(result.success).toBe(false);
        });

        it('rejects float level', () => {
            const result = updateUserSchema.safeParse({ level: 2.5 });
            expect(result.success).toBe(false);
        });
    });
});

