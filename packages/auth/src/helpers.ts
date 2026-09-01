import { getServerSession as nextAuthGetServerSession } from "next-auth";
import { authOptions } from "./config";
import type { Session } from "next-auth";

/**
 * Drop-in replacement for next-auth's getServerSession.
 * Pre-binds authOptions so callers don't have to import it themselves.
 */
export async function getSession(): Promise<Session | null> {
  return nextAuthGetServerSession(authOptions);
}

/**
 * Returns the session if the user is authenticated, otherwise returns null.
 * Use this in server components and route handlers for content that requires login.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session?.user) {
    throw new AuthError(401, "You must be signed in to access this.");
  }
  return session;
}

/**
 * Returns the session if the user is an admin, otherwise throws.
 * Use this in server components and route handlers for admin-only content.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session?.user) {
    throw new AuthError(401, "You must be signed in to access this.");
  }
  if (!session.user.admin) {
    throw new AuthError(403, "You do not have permission to access this.");
  }
  return session;
}

export class AuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}
