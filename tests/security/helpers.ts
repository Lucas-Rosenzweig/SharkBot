/**
 * Shared helpers used across security test files.
 */
import { type Express } from 'express';
import request from 'supertest';
import type TestAgent from 'supertest/lib/agent';

/**
 * Create a persistent supertest agent that maintains cookies (session) across requests.
 */
export function createAgent(app: Express): TestAgent {
    return request.agent(app);
}

/**
 * Fetch a CSRF token + cookie pair from the test app.
 * Returns { token, cookies } where cookies is the raw Set-Cookie string
 * to replay with subsequent requests.
 */
export async function getCsrf(app: Express, extraHeaders: Record<string, string> = {}) {
    const res = await request(app)
        .get('/api/csrf-token')
        .set(extraHeaders);

    const token: string = res.body.csrfToken;

    // Collect all Set-Cookie values (session + __csrf)
    const rawCookies = res.headers['set-cookie'];
    const cookies: string[] = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
    const cookieHeader = cookies.map((c: string) => c.split(';')[0]).join('; ');

    return { token, cookieHeader, cookies };
}

/**
 * Shorthand to make an authenticated + CSRF-protected request.
 * Uses a persistent agent so the session cookie from getCsrf is reused.
 */
export async function authCsrfRequest(
    app: Express,
    method: 'post' | 'put' | 'delete',
    url: string,
    body?: object,
) {
    const agent = createAgent(app);

    // Step 1: Fetch CSRF token (this also sets session + __csrf cookies on the agent)
    const csrfRes = await agent
        .get('/api/csrf-token')
        .set('x-test-user', 'admin');

    const token: string = csrfRes.body.csrfToken;

    // Step 2: Make the actual request with the same agent (cookies are preserved)
    let req = agent[method](url)
        .set('x-test-user', 'admin')
        .set('x-csrf-token', token);

    if (body) {
        req = req.send(body).set('Content-Type', 'application/json');
    }

    return req;
}


