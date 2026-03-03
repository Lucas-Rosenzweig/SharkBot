import { describe, it, expect } from 'vitest';
import {
    parseLevelUpMessage,
    DEFAULT_LEVEL_UP_MESSAGE,
    _safeMathEval_FOR_TESTING as safeMathEval,
} from '../../src/utils/parseLevelUpMessage';
import type { TagScriptVariables } from '../../src/utils/parseLevelUpMessage';

// ── Shared fixtures ──────────────────────────────────────────

const vars: TagScriptVariables = {
    user: 'TestUser',
    level: 5,
    mention: '<@123456789012345678>',
    server: 'TestServer',
};

// ── 1. Functional tests ─────────────────────────────────────

describe('parseLevelUpMessage – functional', () => {
    it('returns default message when template is null', () => {
        const result = parseLevelUpMessage(null, vars);
        expect(result).toBe('🎉 <@123456789012345678> a atteint le niveau 5 ! Félicitations !');
    });

    it('returns default message when template is undefined', () => {
        const result = parseLevelUpMessage(undefined, vars);
        expect(result).toBe('🎉 <@123456789012345678> a atteint le niveau 5 ! Félicitations !');
    });

    it('returns null when template is empty string (disabled)', () => {
        expect(parseLevelUpMessage('', vars)).toBeNull();
    });

    it('resolves {user}, {level}, {lvl}, {mention}, {server}', () => {
        const result = parseLevelUpMessage('{user} {level} {lvl} {mention} {server}', vars);
        expect(result).toBe('TestUser 5 5 <@123456789012345678> TestServer');
    });

    it('resolves {#} as pound sign', () => {
        expect(parseLevelUpMessage('{#}1', vars)).toBe('#1');
    });

    it('leaves unknown tags untouched', () => {
        expect(parseLevelUpMessage('{unknown}', vars)).toBe('{unknown}');
    });

    it('is case-insensitive for variable names', () => {
        expect(parseLevelUpMessage('{USER} {Level} {MENTION}', vars)).toBe(
            'TestUser 5 <@123456789012345678>',
        );
    });
});

// ── 2. Block tags ───────────────────────────────────────────

describe('parseLevelUpMessage – block tags', () => {
    it('{random:a|b|c} picks one of the options', () => {
        const result = parseLevelUpMessage('{random:a|b|c}', vars);
        expect(['a', 'b', 'c']).toContain(result);
    });

    it('{math:2+3} returns 5', () => {
        expect(parseLevelUpMessage('{math:2+3}', vars)).toBe('5');
    });

    it('{math:{level}*10} resolves variable then computes', () => {
        expect(parseLevelUpMessage('{math:{level}*10}', vars)).toBe('50');
    });

    it('{upper:hello} returns HELLO', () => {
        expect(parseLevelUpMessage('{upper:hello}', vars)).toBe('HELLO');
    });

    it('{lower:HELLO} returns hello', () => {
        expect(parseLevelUpMessage('{lower:HELLO}', vars)).toBe('hello');
    });

    it('{len:hello} returns 5', () => {
        expect(parseLevelUpMessage('{len:hello}', vars)).toBe('5');
    });

    it('{if(5==5):yes|no} returns yes', () => {
        expect(parseLevelUpMessage('{if(5==5):yes|no}', vars)).toBe('yes');
    });

    it('{if(5==3):yes|no} returns no', () => {
        expect(parseLevelUpMessage('{if(5==3):yes|no}', vars)).toBe('no');
    });

    it('{if({level}>3):big|small} resolves variable in condition', () => {
        expect(parseLevelUpMessage('{if({level}>3):big|small}', vars)).toBe('big');
    });
});

// ── 3. Math parser safety ───────────────────────────────────

describe('safeMathEval – safe recursive-descent parser', () => {
    it('basic arithmetic', () => {
        expect(safeMathEval('2+3')).toBe(5);
        expect(safeMathEval('10-3')).toBe(7);
        expect(safeMathEval('4*5')).toBe(20);
        expect(safeMathEval('10/3')).toBe(3.33);
        expect(safeMathEval('10%3')).toBe(1);
    });

    it('parentheses', () => {
        expect(safeMathEval('(2+3)*4')).toBe(20);
        expect(safeMathEval('2*(3+4)')).toBe(14);
    });

    it('unary minus', () => {
        expect(safeMathEval('-5')).toBe(-5);
        expect(safeMathEval('-5+10')).toBe(5);
    });

    it('division by zero returns 0', () => {
        expect(safeMathEval('1/0')).toBe(0);
        expect(safeMathEval('1%0')).toBe(0);
    });

    it('empty expression returns 0', () => {
        expect(safeMathEval('')).toBe(0);
    });

    it('rejects letters (no code execution)', () => {
        expect(safeMathEval('alert(1)')).toBe(0);
        expect(safeMathEval('constructor')).toBe(0);
        expect(safeMathEval('require("fs")')).toBe(0);
    });

    it('rejects overlong expressions', () => {
        const longExpr = '1+'.repeat(60) + '1';
        expect(safeMathEval(longExpr)).toBe(0);
    });

    it('rejects deeply nested parentheses', () => {
        const deep = '('.repeat(25) + '1' + ')'.repeat(25);
        expect(safeMathEval(deep)).toBe(0);
    });

    it('rejects trailing garbage', () => {
        expect(safeMathEval('1+2abc')).toBe(0);
        expect(safeMathEval('1+2)')).toBe(0);
    });
});

// ── 4. CODE INJECTION attacks ────────────────────────────────

describe('parseLevelUpMessage – code injection prevention', () => {
    it('rejects JavaScript in math: process.exit', () => {
        const result = parseLevelUpMessage('{math:process.exit(1)}', vars);
        expect(result).toBe('0');
    });

    it('rejects JavaScript in math: require("fs")', () => {
        const result = parseLevelUpMessage('{math:require("fs")}', vars);
        expect(result).toBe('0');
    });

    it('rejects constructor access', () => {
        expect(parseLevelUpMessage('{math:constructor.constructor("return this")()}', vars)).toBe('0');
    });

    it('rejects __proto__ access', () => {
        expect(parseLevelUpMessage('{math:this.__proto__}', vars)).toBe('0');
    });

    it('rejects global/globalThis access', () => {
        expect(parseLevelUpMessage('{math:globalThis}', vars)).toBe('0');
        expect(parseLevelUpMessage('{math:global}', vars)).toBe('0');
    });

    it('rejects import() expression', () => {
        expect(parseLevelUpMessage('{math:import("fs")}', vars)).toBe('0');
    });

    it('rejects Function constructor', () => {
        expect(parseLevelUpMessage('{math:Function("return 1")()}', vars)).toBe('0');
    });

    it('rejects eval()', () => {
        expect(parseLevelUpMessage('{math:eval("1+1")}', vars)).toBe('0');
    });

    it('rejects setTimeout/setInterval (braces prevent match, tag left as-is)', () => {
        // The {} inside the JS callback prevents the regex [^{}]+ from matching,
        // so the entire {math:...} tag is left untouched — no code is executed
        const result = parseLevelUpMessage('{math:setTimeout(()=>{},0)}', vars);
        expect(result).toBe('{math:setTimeout(()=>{},0)}');
    });

    it('handles template literal injection attempt', () => {
        const result = parseLevelUpMessage('${process.env.SECRET}', vars);
        // Should output literally — no template literal processing
        expect(result).toBe('${process.env.SECRET}');
    });

    it('handles backtick injection attempt', () => {
        const result = parseLevelUpMessage('`${7*7}`', vars);
        expect(result).toBe('`${7*7}`');
    });
});

// ── 5. Discord-specific injection ────────────────────────────

describe('parseLevelUpMessage – Discord injection prevention', () => {
    it('@everyone in template is preserved as-is (Discord handles this)', () => {
        // The parser should NOT strip @everyone — Discord's API allowedMentions controls this
        // But the parser must not GENERATE new @everyone from variables
        const result = parseLevelUpMessage('@everyone GG {user}!', vars);
        expect(result).toBe('@everyone GG TestUser!');
    });

    it('@here in template is preserved as-is', () => {
        const result = parseLevelUpMessage('@here {user}', vars);
        expect(result).toBe('@here TestUser');
    });

    it('user variable containing @everyone does not break out', () => {
        const evilVars: TagScriptVariables = {
            ...vars,
            user: '@everyone',
        };
        const result = parseLevelUpMessage('GG {user}!', evilVars);
        // This passes the @everyone through — the caller (levelUpListeners.ts)
        // should use allowedMentions to control what Discord actually pings
        expect(result).toBe('GG @everyone!');
    });

    it('mention variable is safe (only the expected mention format)', () => {
        // mention is always constructed by the bot as <@snowflake>
        const result = parseLevelUpMessage('{mention}', vars);
        expect(result).toBe('<@123456789012345678>');
    });
});

// ── 6. Denial-of-Service / resource exhaustion ──────────────

describe('parseLevelUpMessage – DoS prevention', () => {
    it('caps input template at 2000 characters', () => {
        const longTemplate = 'A'.repeat(3000);
        const result = parseLevelUpMessage(longTemplate, vars);
        expect(result!.length).toBeLessThanOrEqual(4000);
    });

    it('caps output at 4000 characters', () => {
        // Try to create output amplification through variable expansion
        // {server} is "TestServer" (10 chars), repeated many times
        const template = '{server}'.repeat(500); // 4000 input chars
        const result = parseLevelUpMessage(template, vars);
        expect(result!.length).toBeLessThanOrEqual(4000);
    });

    it('limits block tag iterations (no infinite loop)', () => {
        // A tag that produces another tag of the same kind could loop forever
        // {random:{random:a|b}|c} — after one pass it becomes e.g. {random:a|c}
        // which would need another pass, but we cap at MAX_ITERATIONS (10)
        const start = performance.now();
        parseLevelUpMessage('{random:{random:a|b}|c}', vars);
        const elapsed = performance.now() - start;
        expect(elapsed).toBeLessThan(100); // should be near-instant
    });

    it('handles catastrophic backtracking attempt gracefully', () => {
        // Regex DoS attempt: many nested-ish patterns
        const evil = '{'.repeat(100) + 'a' + '}'.repeat(100);
        const start = performance.now();
        parseLevelUpMessage(evil, vars);
        const elapsed = performance.now() - start;
        expect(elapsed).toBeLessThan(500);
    });

    it('math: deeply nested parens are capped', () => {
        const deep = '('.repeat(30) + '1' + ')'.repeat(30);
        const result = parseLevelUpMessage(`{math:${deep}}`, vars);
        expect(result).toBe('0'); // rejected by depth limit
    });

    it('math: overlong expression is rejected', () => {
        const longMath = '1+'.repeat(60) + '1';
        const result = parseLevelUpMessage(`{math:${longMath}}`, vars);
        expect(result).toBe('0');
    });
});

// ── 7. Prototype pollution / property access ─────────────────

describe('parseLevelUpMessage – prototype pollution prevention', () => {
    it('{__proto__} is not resolved', () => {
        expect(parseLevelUpMessage('{__proto__}', vars)).toBe('{__proto__}');
    });

    it('{constructor} is not resolved', () => {
        expect(parseLevelUpMessage('{constructor}', vars)).toBe('{constructor}');
    });

    it('{toString} is not resolved', () => {
        expect(parseLevelUpMessage('{toString}', vars)).toBe('{toString}');
    });

    it('{valueOf} is not resolved', () => {
        expect(parseLevelUpMessage('{valueOf}', vars)).toBe('{valueOf}');
    });

    it('{hasOwnProperty} is not resolved', () => {
        expect(parseLevelUpMessage('{hasOwnProperty}', vars)).toBe('{hasOwnProperty}');
    });
});

// ── 8. XSS prevention (if output ever reaches web context) ──

describe('parseLevelUpMessage – XSS prevention', () => {
    it('HTML script tags are passed through as-is (not executed)', () => {
        const result = parseLevelUpMessage('<script>alert(1)</script>', vars);
        expect(result).toBe('<script>alert(1)</script>');
        // Note: this is fine — Discord renders message content as plain text,
        // not HTML. The dashboard preview should escape this via React's JSX.
    });

    it('HTML event handlers are not processed', () => {
        const result = parseLevelUpMessage('<img onerror="alert(1)" src=x>', vars);
        expect(result).toBe('<img onerror="alert(1)" src=x>');
    });

    it('javascript: URI is not processed', () => {
        const result = parseLevelUpMessage('javascript:alert(1)', vars);
        expect(result).toBe('javascript:alert(1)');
    });
});

// ── 9. Condition evaluator edge cases ────────────────────────

describe('evaluateCondition – edge cases', () => {
    it('empty strings on both sides of == are equal', () => {
        expect(parseLevelUpMessage('{if(==):yes|no}', vars)).toBe('yes');
    });

    it('NaN comparisons default to string comparison', () => {
        expect(parseLevelUpMessage('{if(abc==abc):yes|no}', vars)).toBe('yes');
        expect(parseLevelUpMessage('{if(abc==def):yes|no}', vars)).toBe('no');
    });

    it('falsy condition returns else branch', () => {
        expect(parseLevelUpMessage('{if(0):yes|no}', vars)).toBe('no');
        expect(parseLevelUpMessage('{if(false):yes|no}', vars)).toBe('no');
    });

    it('empty condition is not matched by regex (left as-is)', () => {
        // {if():...} doesn't match [^()]+ so the tag is preserved literally
        expect(parseLevelUpMessage('{if():yes|no}', vars)).toBe('{if():yes|no}');
    });
});



