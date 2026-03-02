import { doubleCsrf } from 'csrf-csrf';
import type { Request } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
    throw new Error('SESSION_SECRET environment variable is required for CSRF protection');
}

export const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
    getSecret: () => sessionSecret,
    getSessionIdentifier: (req: Request) => req.session?.id ?? '',
    cookieName: '__csrf',
    cookieOptions: {
        httpOnly: false, // Readable by client JS to send as header
        sameSite: isProduction ? 'none' : 'lax',
        secure: isProduction,
        path: '/',
    },
    getCsrfTokenFromRequest: (req: Request) =>
        req.headers['x-csrf-token'] as string,
});


