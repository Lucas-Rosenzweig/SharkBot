import { describe, it, expect } from 'vitest';
import { getDiscordAvatarUrl } from '../../lib/avatar';

describe('getDiscordAvatarUrl', () => {
    it('returns custom avatar URL when avatar hash is provided', () => {
        const url = getDiscordAvatarUrl({
            id: '123456789012345678',
            username: 'Test',
            discriminator: '0001',
            avatar: 'abc123',
        });
        expect(url).toBe(
            'https://cdn.discordapp.com/avatars/123456789012345678/abc123.png?size=64',
        );
    });

    it('respects custom size parameter', () => {
        const url = getDiscordAvatarUrl(
            { id: '123456789012345678', username: 'Test', discriminator: '0', avatar: 'abc' },
            128,
        );
        expect(url).toContain('size=128');
    });

    it('returns pomelo fallback when discriminator is 0', () => {
        const url = getDiscordAvatarUrl({
            id: '123456789012345678',
            username: 'Test',
            discriminator: '0',
            avatar: null,
        });
        expect(url).toMatch(/https:\/\/cdn\.discordapp\.com\/embed\/avatars\/\d\.png/);
    });

    it('returns pomelo fallback when discriminator is 0000', () => {
        const url = getDiscordAvatarUrl({
            id: '123456789012345678',
            username: 'Test',
            discriminator: '0000',
            avatar: null,
        });
        expect(url).toMatch(/https:\/\/cdn\.discordapp\.com\/embed\/avatars\/\d\.png/);
    });

    it('returns legacy fallback for non-pomelo users', () => {
        const url = getDiscordAvatarUrl({
            id: '123456789012345678',
            username: 'Test',
            discriminator: '1234',
            avatar: null,
        });
        // 1234 % 5 = 4
        expect(url).toBe('https://cdn.discordapp.com/embed/avatars/4.png');
    });

    it('pomelo index is derived from user ID', () => {
        // (BigInt('123456789012345678') >> 22n) % 6n
        const url = getDiscordAvatarUrl({
            id: '123456789012345678',
            username: 'Test',
            discriminator: '0',
            avatar: null,
        });
        const index = Number((BigInt('123456789012345678') >> 22n) % 6n);
        expect(url).toBe(`https://cdn.discordapp.com/embed/avatars/${index}.png`);
    });
});

