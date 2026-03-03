/**
 * Lightweight TagScript engine for level-up message templates.
 *
 * Supported tags:
 *   {user}       – Display name of the user
 *   {lvl}        – New level number (alias: {level})
 *   {level}      – New level number
 *   {mention}    – Discord mention (<@discordId>)
 *   {server}     – Server/guild name
 *   {#}          – Pound sign literal
 *
 * Built-in block tags:
 *   {random:opt1|opt2|opt3}  – Pick a random option
 *   {math:expression}        – Evaluate simple math (+-/*%)
 *   {if(condition):then|else} – Conditional (== != > < >= <=)
 *   {upper:text}             – Uppercase
 *   {lower:text}             – Lowercase
 *   {len:text}               – Length of text
 *
 * Security:
 *   - No eval() / new Function() — math uses a recursive-descent parser
 *   - Input template capped at MAX_TEMPLATE_LENGTH (2 000 chars)
 *   - Output capped at MAX_OUTPUT_LENGTH (4 000 chars)
 *   - Block-tag resolution loop capped at MAX_ITERATIONS (10)
 *   - Math expression length capped at MAX_MATH_EXPR_LENGTH (100 chars)
 *   - Math parser depth capped at MAX_MATH_DEPTH (20)
 */

import {
    MAX_TEMPLATE_LENGTH,
    MAX_OUTPUT_LENGTH,
    MAX_ITERATIONS,
    MAX_MATH_EXPR_LENGTH,
    MAX_MATH_DEPTH,
    DEFAULT_LEVEL_UP_MESSAGE,
} from './constants';

export { DEFAULT_LEVEL_UP_MESSAGE } from './constants';

export interface TagScriptVariables {
    user: string;      // Display name
    level: number;     // New level
    mention: string;   // <@discordId>
    server: string;    // Guild name
}

/**
 * Parse a level-up message template.
 *
 * @param template  The raw template string from config.
 *                  - `null` or `undefined` → use DEFAULT_LEVEL_UP_MESSAGE
 *                  - `""` (empty string) → returns `null` (no message)
 *                  - otherwise → parse the template
 * @param vars      Variables to substitute.
 * @returns         The parsed message string, or `null` if no message should be sent.
 */
export function parseLevelUpMessage(
    template: string | null | undefined,
    vars: TagScriptVariables,
): string | null {
    // null/undefined → default message
    if (template === null || template === undefined) {
        return processTemplate(DEFAULT_LEVEL_UP_MESSAGE, vars);
    }

    // empty string → disabled
    if (template === '') {
        return null;
    }

    return processTemplate(template, vars);
}

// ── Internal engine ──────────────────────────────────────────

function processTemplate(template: string, vars: TagScriptVariables): string {
    // Guard: cap input length
    const safeTemplate = template.length > MAX_TEMPLATE_LENGTH
        ? template.slice(0, MAX_TEMPLATE_LENGTH)
        : template;

    let result = safeTemplate;

    // First pass: resolve simple variable tags so block tags can use their values
    // e.g. {math:{level}*10} → {math:5*10}
    result = resolveVariables(result, vars);

    // Second pass: resolve block tags (nested-aware)
    result = resolveBlockTags(result, vars);

    // Third pass: resolve any remaining variable tags produced by block tags
    result = resolveVariables(result, vars);

    // Guard: cap output length
    if (result.length > MAX_OUTPUT_LENGTH) {
        result = result.slice(0, MAX_OUTPUT_LENGTH);
    }

    return result;
}

function resolveVariables(text: string, vars: TagScriptVariables): string {
    // Use Map to avoid prototype pollution — plain objects inherit
    // __proto__, constructor, toString, etc. from Object.prototype
    const replacements = new Map<string, string>([
        ['user', vars.user],
        ['level', String(vars.level)],
        ['lvl', String(vars.level)],
        ['mention', vars.mention],
        ['server', vars.server],
        ['#', '#'],
    ]);

    return text.replace(/\{(\w+|#)}/g, (match, key: string) => {
        const lower = key.toLowerCase();
        return replacements.has(lower) ? replacements.get(lower)! : match;
    });
}

function resolveBlockTags(text: string, vars: TagScriptVariables): string {
    let previous = '';
    let current = text;
    let iterations = 0;

    while (current !== previous && iterations < MAX_ITERATIONS) {
        previous = current;
        current = processBlockTagsOnce(current, vars);
        iterations++;

        // Guard: bail if output is exploding in size
        if (current.length > MAX_OUTPUT_LENGTH) {
            return current.slice(0, MAX_OUTPUT_LENGTH);
        }
    }

    return current;
}

function processBlockTagsOnce(text: string, vars: TagScriptVariables): string {
    // {random:opt1|opt2|opt3}
    text = text.replace(/\{random:([^{}]+)}/gi, (_match, content: string) => {
        const options = content.split('|').map(s => s.trim()).filter(Boolean);
        if (options.length === 0) return '';
        return options[Math.floor(Math.random() * options.length)];
    });

    // {math:expression}
    text = text.replace(/\{math:([^{}]+)}/gi, (_match, expr: string) => {
        return String(safeMathEval(resolveVariables(expr, vars)));
    });

    // {upper:text}
    text = text.replace(/\{upper:([^{}]+)}/gi, (_match, content: string) => {
        return resolveVariables(content, vars).toUpperCase();
    });

    // {lower:text}
    text = text.replace(/\{lower:([^{}]+)}/gi, (_match, content: string) => {
        return resolveVariables(content, vars).toLowerCase();
    });

    // {len:text}
    text = text.replace(/\{len:([^{}]+)}/gi, (_match, content: string) => {
        return String(resolveVariables(content, vars).length);
    });

    // {if(condition):then|else}
    text = text.replace(
        /\{if\(([^()]+)\):([^{}]*)}/gi,
        (_match, condition: string, body: string) => {
            const parts = body.split('|');
            const thenPart = parts[0] || '';
            const elsePart = parts[1] || '';
            return evaluateCondition(condition, vars)
                ? resolveVariables(thenPart, vars)
                : resolveVariables(elsePart, vars);
        },
    );

    return text;
}

// ── Safe math evaluator — recursive-descent parser, NO eval ─

/**
 * Evaluates a simple arithmetic expression using a hand-written
 * recursive-descent parser. Supports: +, -, *, /, %, parentheses,
 * and unary minus. Returns 0 on any error.
 *
 * Grammar:
 *   expr   → term (('+' | '-') term)*
 *   term   → unary (('*' | '/' | '%') unary)*
 *   unary  → '-' unary | primary
 *   primary→ NUMBER | '(' expr ')'
 */
function safeMathEval(expr: string): number {
    const sanitized = expr.replace(/\s+/g, '');

    // Reject overlong expressions
    if (sanitized.length > MAX_MATH_EXPR_LENGTH) return 0;

    // Reject any character that is not a digit, dot, or operator
    if (!/^[\d+\-*/%().]+$/.test(sanitized)) return 0;

    // Reject empty
    if (sanitized.length === 0) return 0;

    let pos = 0;
    let depth = 0;

    function peek(): string {
        return sanitized[pos] ?? '';
    }

    function consume(): string {
        return sanitized[pos++] ?? '';
    }

    function parseExpr(): number {
        let left = parseTerm();
        while (peek() === '+' || peek() === '-') {
            const op = consume();
            const right = parseTerm();
            left = op === '+' ? left + right : left - right;
        }
        return left;
    }

    function parseTerm(): number {
        let left = parseUnary();
        while (peek() === '*' || peek() === '/' || peek() === '%') {
            const op = consume();
            const right = parseUnary();
            if (op === '*') left = left * right;
            else if (op === '/') left = right !== 0 ? left / right : 0;
            else left = right !== 0 ? left % right : 0;
        }
        return left;
    }

    function parseUnary(): number {
        if (peek() === '-') {
            consume();
            return -parseUnary();
        }
        return parsePrimary();
    }

    function parsePrimary(): number {
        if (peek() === '(') {
            consume(); // '('
            depth++;
            if (depth > MAX_MATH_DEPTH) return 0;
            const val = parseExpr();
            if (peek() === ')') consume(); // ')'
            depth--;
            return val;
        }
        // Parse a number: digits and at most one decimal point
        let numStr = '';
        let hasDot = false;
        while (/[\d.]/.test(peek())) {
            if (peek() === '.') {
                if (hasDot) break; // only one decimal point
                hasDot = true;
            }
            numStr += consume();
        }
        if (numStr === '' || numStr === '.') return 0;
        const val = Number(numStr);
        return isFinite(val) ? val : 0;
    }

    try {
        const result = parseExpr();

        // Ensure the entire expression was consumed (reject trailing garbage)
        if (pos !== sanitized.length) return 0;

        if (!isFinite(result)) return 0;
        return Math.round(result * 100) / 100;
    } catch {
        return 0;
    }
}

// ── Condition evaluator ─────────────────────────────────────

function evaluateCondition(condition: string, vars: TagScriptVariables): boolean {
    const resolved = resolveVariables(condition, vars);

    // Try comparison operators (ordered longest-first to avoid partial matches)
    const operators = ['==', '!=', '>=', '<=', '>', '<'] as const;
    for (const op of operators) {
        const idx = resolved.indexOf(op);
        if (idx !== -1) {
            const left = resolved.substring(0, idx).trim();
            const right = resolved.substring(idx + op.length).trim();

            const leftNum = Number(left);
            const rightNum = Number(right);
            const isNumeric = !isNaN(leftNum) && !isNaN(rightNum)
                && left !== '' && right !== '';

            switch (op) {
                case '==': return isNumeric ? leftNum === rightNum : left === right;
                case '!=': return isNumeric ? leftNum !== rightNum : left !== right;
                case '>=': return isNumeric ? leftNum >= rightNum : left >= right;
                case '<=': return isNumeric ? leftNum <= rightNum : left <= right;
                case '>':  return isNumeric ? leftNum > rightNum : left > right;
                case '<':  return isNumeric ? leftNum < rightNum : left < right;
            }
        }
    }

    // Truthy check: non-empty and not "false" / "0"
    const trimmed = resolved.trim().toLowerCase();
    return trimmed !== '' && trimmed !== 'false' && trimmed !== '0';
}

// ── Export safeMathEval for testing ──────────────────────────
export { safeMathEval as _safeMathEval_FOR_TESTING };



