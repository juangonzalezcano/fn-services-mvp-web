import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ account, profile }) {
           console.log('signIn', account, profile);
            return true;
        },
        async redirect({ url, baseUrl }) {
            // If URL is an absolute URL, return it as is.
            if (url.startsWith('http')) return url;
            // Otherwise, construct the full URL.
            return `${baseUrl}${url}`;
        },
    },
});

export { handler as GET, handler as POST };
