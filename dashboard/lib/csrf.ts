/**
 * Read the CSRF token from the `__csrf` cookie set by the API.
 * The cookie is NOT httpOnly so it can be read by client-side JS.
 */
export function getCsrfToken(): string {
    const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith('__csrf='));
    return match ? decodeURIComponent(match.split('=')[1]) : '';
}

/**
 * Fetch a fresh CSRF token from the API and return it.
 * Also sets / refreshes the `__csrf` cookie via Set-Cookie.
 */
export async function fetchCsrfToken(): Promise<string> {
    const res = await fetch('/api/csrf-token', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch CSRF token');
    const data = await res.json();
    return data.csrfToken as string;
}

/**
 * Build headers object including the CSRF token for mutating requests.
 */
export function csrfHeaders(extra: Record<string, string> = {}): Record<string, string> {
    return {
        'x-csrf-token': getCsrfToken(),
        ...extra,
    };
}

