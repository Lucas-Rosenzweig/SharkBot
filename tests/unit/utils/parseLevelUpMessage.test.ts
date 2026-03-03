import { describe, it, expect } from 'vitest';
import {
    parseLevelUpMessage,
    _safeMathEval_FOR_TESTING as safeMathEval,
} from '../../../src/utils/parseLevelUpMessage';
import { DEFAULT_LEVEL_UP_MESSAGE } from '../../../src/utils/constants';

const vars = {
    user: 'TestUser',
    level: 5,
    mention: '<@123456789>',
    server: 'Test Server',
};

describe('parseLevelUpMessage', () => {
    describe('template handling', () => {
        it('returns default message when template is null', () => {
            const result = parseLevelUpMessage(null, vars);
            expect(result).toContain('<@123456789>');
            expect(result).toContain('5');
        });

        it('returns default message when template is undefined', () => {
            const result = parseLevelUpMessage(undefined, vars);
            expect(result).not.toBeNull();
            expect(result).toContain('5');
        });

        it('returns null when template is empty string (disabled)', () => {
            expect(parseLevelUpMessage('', vars)).toBeNull();
        });

        it('parses custom template', () => {
            const result = parseLevelUpMessage('GG {user} level {level}!', vars);
            expect(result).toBe('GG TestUser level 5!');
        });
    });

    describe('variable substitution', () => {
        it('replaces {user}', () => {
            expect(parseLevelUpMessage('{user}', vars)).toBe('TestUser');
        });

        it('replaces {level} and {lvl} (alias)', () => {
            expect(parseLevelUpMessage('{level} = {lvl}', vars)).toBe('5 = 5');
        });

        it('replaces {mention}', () => {
            expect(parseLevelUpMessage('{mention}', vars)).toBe('<@123456789>');
        });

        it('replaces {server}', () => {
            expect(parseLevelUpMessage('{server}', vars)).toBe('Test Server');
        });

        it('replaces {#} with literal #', () => {
            expect(parseLevelUpMessage('{#}', vars)).toBe('#');
        });

        it('preserves unknown tags', () => {
            expect(parseLevelUpMessage('{unknown}', vars)).toBe('{unknown}');
        });
    });

    describe('block tags', () => {
        it('resolves {random:...} with one option', () => {
            const result = parseLevelUpMessage('{random:hello}', vars);
            expect(result).toBe('hello');
        });

        it('{random:...} picks from options', () => {
            const options = new Set<string>();
            for (let i = 0; i < 50; i++) {
                const r = parseLevelUpMessage('{random:a|b|c}', vars);
                if (r) options.add(r);
            }
            expect(options.size).toBeGreaterThanOrEqual(2);
        });

        it('resolves {math:...}', () => {
            expect(parseLevelUpMessage('{math:2+3}', vars)).toBe('5');
        });

        it('resolves {math:...} with level variable', () => {
            expect(parseLevelUpMessage('{math:{level}*10}', vars)).toBe('50');
        });

        it('resolves {upper:...}', () => {
            expect(parseLevelUpMessage('{upper:hello}', vars)).toBe('HELLO');
        });

        it('resolves {lower:...}', () => {
            expect(parseLevelUpMessage('{lower:HELLO}', vars)).toBe('hello');
        });

        it('resolves {len:...}', () => {
            expect(parseLevelUpMessage('{len:hello}', vars)).toBe('5');
        });

        it('resolves {if(...):then|else} — true condition', () => {
            expect(parseLevelUpMessage('{if({level}>3):high|low}', vars)).toBe('high');
        });

        it('resolves {if(...):then|else} — false condition', () => {
            expect(parseLevelUpMessage('{if({level}>10):high|low}', vars)).toBe('low');
        });
    });

    describe('security', () => {
        it('truncates overly long templates', () => {
            const long = 'a'.repeat(3000);
            const result = parseLevelUpMessage(long, vars);
            expect(result!.length).toBeLessThanOrEqual(4000);
        });

        it('truncates overly long output', () => {
            // Generate something that could expand
            const template = '{user}'.repeat(1000);
            const result = parseLevelUpMessage(template, vars);
            expect(result!.length).toBeLessThanOrEqual(4000);
        });
    });
});

describe('safeMathEval', () => {
    it('evaluates basic addition', () => {
        expect(safeMathEval('2+3')).toBe(5);
    });

    it('evaluates subtraction', () => {
        expect(safeMathEval('10-3')).toBe(7);
    });

    it('evaluates multiplication', () => {
        expect(safeMathEval('4*5')).toBe(20);
    });

    it('evaluates division', () => {
        expect(safeMathEval('10/4')).toBe(2.5);
    });

    it('evaluates modulo', () => {
        expect(safeMathEval('10%3')).toBe(1);
    });

    it('respects operator precedence', () => {
        expect(safeMathEval('2+3*4')).toBe(14);
    });

    it('handles parentheses', () => {
        expect(safeMathEval('(2+3)*4')).toBe(20);
    });

    it('handles unary minus', () => {
        expect(safeMathEval('-5+10')).toBe(5);
    });

    it('returns 0 for division by zero', () => {
        expect(safeMathEval('5/0')).toBe(0);
    });

    it('returns 0 for empty string', () => {
        expect(safeMathEval('')).toBe(0);
    });

    it('returns 0 for invalid characters', () => {
        expect(safeMathEval('eval("bad")')).toBe(0);
    });

    it('returns 0 for overly long expression', () => {
        expect(safeMathEval('1+'.repeat(60) + '1')).toBe(0);
    });

    it('handles decimal numbers', () => {
        expect(safeMathEval('1.5+2.5')).toBe(4);
    });
});

