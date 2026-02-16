import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    pages: {
        signIn: "/auth/login",
        error: "/auth/error",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
            const isOnAuth = nextUrl.pathname.startsWith('/auth')

            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            } else if (isOnAuth) {
                if (isLoggedIn) {
                    return Response.redirect(new URL('/dashboard', nextUrl))
                }
                return true
            }

            return true
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
            }
            return token
        },
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub
                session.user.role = token.role as string // Pass role to session
            }
            return session
        },
    },
    providers: [], // Configured in auth.ts
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    trustHost: true,
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                // Force secure to false if using HTTP, otherwise default to true in production
                secure: process.env.NEXTAUTH_URL?.startsWith('https://'),
            },
        },
    },
} satisfies NextAuthConfig
