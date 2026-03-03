'use client';

import { useEffect } from 'react';
import { fetchCsrfToken } from '@/lib/csrf';
import { toast } from 'sonner';

/**
 * Fetches a CSRF token on mount so the __csrf cookie is always available
 * for subsequent mutating requests.
 */
export function CsrfProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        fetchCsrfToken().catch(() => {
            toast.warning('Impossible de charger le jeton CSRF. Certaines actions pourraient échouer.');
        });
    }, []);

    return <>{children}</>;
}

