import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Check if the user has a session cookie (connect.sid from express-session)
    const sessionCookie = request.cookies.get('connect.sid');

    // Protected routes: /guilds and /guild/* — redirect to login if no cookie
    if (!sessionCookie) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/guilds/:path*', '/guild/:path*'],
};
