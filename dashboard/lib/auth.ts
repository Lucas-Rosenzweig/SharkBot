import { redirect } from 'next/navigation';
import { apiFetch } from './api';
import type { AuthResponse, AuthUser } from './types';

/**
 * Server-side helper: fetches the authenticated user or redirects to login.
 */
export async function getAuthenticatedUser(): Promise<AuthUser> {
    let auth: AuthResponse;
    try {
        auth = await apiFetch<AuthResponse>('/auth/me');
    } catch {
        redirect('/login');
    }

    if (!auth.authenticated || !auth.user) {
        redirect('/login');
    }

    return auth.user;
}

