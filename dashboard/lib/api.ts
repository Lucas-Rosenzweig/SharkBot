import { cookies } from 'next/headers';

const API_BASE = process.env.API_URL || 'http://bot:3001';

export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const res = await fetch(`${API_BASE}/api${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...init?.headers,
            Cookie: cookieHeader,
        },
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error(`API error ${res.status}: ${res.statusText}`);
    }

    return res.json();
}
