import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            authorization: {
                params: {
                    scope: 'openid email profile https://www.googleapis.com/auth/gmail.send',
                    prompt: 'consent',
                    access_type: 'offline',
                },
            },
        }),
    ],
    pages: {
        signIn: '/giris',
    },
    callbacks: {
        async jwt({ token, account, profile }) {
            if (account && profile) {
                token.googleId = profile.sub;
                token.name = profile.name;
                token.email = profile.email;
                token.picture = (profile as { picture?: string }).picture;
            }
            if (account?.access_token) {
                token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { id?: string }).id = token.googleId as string;
                session.user.image = token.picture as string;
                (session as any).accessToken = token.accessToken;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};
