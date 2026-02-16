import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email as string,
                    },
                })

                if (!user || !user.password) {
                    return null
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                if (!isPasswordValid) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.fullName,
                    image: user.avatarUrl,
                    role: user.role,
                }
            },
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user, trigger, session }: { token: any, user: any, trigger?: string, session?: any }) {
            // Initial sign in
            if (user) {
                token.id = user.id
                token.role = user.role
                token.organizationId = user.organizationId
            }

            // Refetch user data on session update
            if (trigger === "update" && token.sub) {
                const freshUser = await prisma.user.findUnique({
                    where: { id: token.sub },
                    select: { role: true, organizationId: true }
                })

                if (freshUser) {
                    token.role = freshUser.role
                    token.organizationId = freshUser.organizationId
                }
            }

            return token
        },
        async session({ session, token }: { session: any, token: any }) {
            if (session.user && token.sub) {
                session.user.id = token.sub
                session.user.role = token.role as string
                session.user.organizationId = token.organizationId as string || null
            }
            return session
        }
    },
})
