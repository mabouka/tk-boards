import NextAuth from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import Google from 'next-auth/providers/google'
import Facebook from 'next-auth/providers/facebook'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { users, accounts, sessions, verificationTokens } from '@/db/schema'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: { signIn: '/login' },
  providers: [
    // Reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET from env automatically.
    Google({ allowDangerousEmailAccountLinking: true }),
    // Reads AUTH_FACEBOOK_ID / AUTH_FACEBOOK_SECRET from env automatically.
    Facebook({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = String(creds?.email ?? '').toLowerCase().trim()
        const password = String(creds?.password ?? '')
        if (!email || !password) return null

        const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1)
        if (!u?.passwordHash) return null

        const ok = await bcrypt.compare(password, u.passwordHash)
        if (!ok) return null

        // Hard gate: never sign in a password account whose email isn't verified.
        if (!u.emailVerified) return null

        return { id: u.id, email: u.email, name: u.name, image: u.image, tokenVersion: u.tokenVersion }
      },
    }),
  ],
  callbacks: {
    // Keep the token minimal: just the user id. Role / onboarded are read
    // fresh from the DB in the layouts that need them (no stale-token issues).
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.v = (user as { tokenVersion?: number }).tokenVersion ?? 0
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string
      if (session.user) session.user.tokenVersion = (token.v as number) ?? 0
      return session
    },
  },
})
