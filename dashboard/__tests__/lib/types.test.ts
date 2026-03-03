import { describe, it, expect } from 'vitest';
import type {
    AuthUser,
    AuthResponse,
    Guild,
    Config,
    UserData,
    Pagination,
    UsersResponse,
    LevelRole,
    ReactionRole,
    Role,
    Channel,
    CustomEmoji,
    ChannelMessage,
} from '../../lib/types';
import { DEFAULT_LEVEL_UP_MESSAGE } from '../../lib/types';

describe('Dashboard types', () => {
    it('AuthUser has required fields', () => {
        const user: AuthUser = {
            id: '123',
            username: 'Test',
            discriminator: '0',
            avatar: null,
        };
        expect(user.id).toBe('123');
    });

    it('AuthResponse has authenticated field', () => {
        const response: AuthResponse = { authenticated: true, user: { id: '1', username: 'a', discriminator: '0', avatar: null } };
        expect(response.authenticated).toBe(true);
    });

    it('Guild has required fields', () => {
        const guild: Guild = { id: '1', name: 'Test', icon: null };
        expect(guild.name).toBe('Test');
    });

    it('Config has default fields', () => {
        const config: Config = {
            xpCooldown: 20,
            xpPerMessage: 15,
            xpPerMinute: 5,
            voiceXpRequireUnmuted: false,
        };
        expect(config.xpCooldown).toBe(20);
    });

    it('Config levelUpMessage can be null, undefined, or string', () => {
        const c1: Config = { xpCooldown: 1, xpPerMessage: 1, xpPerMinute: 1, voiceXpRequireUnmuted: false, levelUpMessage: null };
        const c2: Config = { xpCooldown: 1, xpPerMessage: 1, xpPerMinute: 1, voiceXpRequireUnmuted: false, levelUpMessage: 'GG' };
        const c3: Config = { xpCooldown: 1, xpPerMessage: 1, xpPerMinute: 1, voiceXpRequireUnmuted: false };
        expect(c1.levelUpMessage).toBeNull();
        expect(c2.levelUpMessage).toBe('GG');
        expect(c3.levelUpMessage).toBeUndefined();
    });

    it('UserData has XP fields', () => {
        const user: UserData = {
            id: 1, discordId: '123', guildId: '456', username: 'Test', avatarHash: null,
            xpTotal: 100, xpCurrent: 50, xpNext: 155, level: 1,
        };
        expect(user.xpTotal).toBe(100);
    });

    it('UsersResponse has users and pagination', () => {
        const data: UsersResponse = {
            users: [],
            pagination: { page: 1, limit: 25, total: 0, totalPages: 0 },
        };
        expect(data.users).toHaveLength(0);
        expect(data.pagination.page).toBe(1);
    });

    it('LevelRole has guildId, roleId, levelReq', () => {
        const lr: LevelRole = { id: '1', guildId: '1', roleId: '1', levelReq: 5 };
        expect(lr.levelReq).toBe(5);
    });

    it('ReactionRole has all fields', () => {
        const rr: ReactionRole = {
            id: '1', guildId: '1', messageId: '1', emoji: '🎉', roleId: '1', removeOnUnreact: true,
        };
        expect(rr.removeOnUnreact).toBe(true);
    });

    it('Role has id, name, color', () => {
        const role: Role = { id: '1', name: 'Admin', color: '#FF0000' };
        expect(role.color).toBe('#FF0000');
    });

    it('Channel has id and name', () => {
        const ch: Channel = { id: '1', name: 'general' };
        expect(ch.name).toBe('general');
    });

    it('CustomEmoji has required fields', () => {
        const emoji: CustomEmoji = { id: '1', name: 'pepe', url: 'https://...', animated: false, formatted: '<:pepe:1>' };
        expect(emoji.animated).toBe(false);
    });

    it('ChannelMessage has required fields', () => {
        const msg: ChannelMessage = {
            id: '1', content: 'Hello', author: { username: 'Bot', avatar: null }, timestamp: 12345,
        };
        expect(msg.content).toBe('Hello');
    });

    it('DEFAULT_LEVEL_UP_MESSAGE contains template tags', () => {
        expect(DEFAULT_LEVEL_UP_MESSAGE).toContain('{mention}');
        expect(DEFAULT_LEVEL_UP_MESSAGE).toContain('{level}');
    });
});

