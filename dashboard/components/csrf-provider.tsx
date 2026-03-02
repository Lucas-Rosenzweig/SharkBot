'use client';

import { useEffect } from 'react';
import { fetchCsrfToken } from '@/lib/csrf';

/**
 * Fetches a CSRF token on mount so the __csrf cookie is always available
 * for subsequent mutating requests.
 */
export function CsrfProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        fetchCsrfToken().catch((err) =>
            console.warn('[CSRF] Failed to prefetch token:', err)
        );
    }, []);

    return <>{children}</>;
}

