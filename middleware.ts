import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
    function middleware(req: NextRequest) {
        const url = req.nextUrl.clone();
        const token = req.cookies.get('next-auth.session-token') || req.cookies.get('__Secure-next-auth.session-token');

        // If there is no token, redirect to the sign-in page
        if (!token) {
            const signInUrl = new URL('/auth/signin', req.url);
            signInUrl.searchParams.set('callbackUrl', req.url);
            return NextResponse.redirect(signInUrl);
        }
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: ['/((?!api|_next/static|favicon.ico).*)'],
};
