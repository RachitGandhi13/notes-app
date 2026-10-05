import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@repo/db/client";
import { enabledOAuthProviders } from "./placeholder";

// ── Simple in-memory rate limiter ──────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;

  entry.count += 1;
  return true;
}

// ── Shared NextAuth options ────────────────────────────────────────────────────
export const MAX_PASSWORD_LENGTH = 128;

/**
 * The site's public URL, used to build links in emails. There is deliberately
 * no localhost fallback: if this is unset, a verification or reset link would
 * silently point at localhost, so fail loudly instead.
 */
export function getAppUrl(): string {
  const url = process.env.NEXTAUTH_URL;
  if (!url) {
    throw new Error("NEXTAUTH_URL is not set. It is required to build links in emails.");
  }
  return url.replace(/\/$/, "");
}

const oauth = enabledOAuthProviders();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: false,
  // Shorter than NextAuth's 30-day default. The session is a signed JWT with
  // no server-side revocation, so a shorter lifetime limits how long a stolen
  // token stays useful.
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: {
    signIn: "/auth",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        // bcrypt cost is fixed, but its input isn't: refuse absurdly long passwords.
        if (credentials.password.length > MAX_PASSWORD_LENGTH) return null;
        // Keyed by email, not IP, so the limit holds however the client's address is spoofed.
        if (!checkRateLimit(`login:${credentials.email.toLowerCase()}`, 10, 15 * 60_000)) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.password) return null;

        const valid = await compare(credentials.password, user.password);
        if (!valid) return null;

        // Checked only after the password matches, so this reveals nothing to someone
        // guessing addresses. Skipped when SMTP isn't configured: without email, nobody
        // could ever verify, so requiring it would lock everyone out.
        if (process.env.SMTP_HOST && !user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),

    // Social providers are registered only when their ID and secret are real values.
    // A placeholder would send users to the provider with a fake client ID.
    ...(oauth.github
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),

    ...(oauth.google
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],

  callbacks: {
    async jwt({ token }) {
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { id: true, admin: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.admin = dbUser.admin;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.admin = token.admin as boolean;
      }
      return session;
    },
  },
};
