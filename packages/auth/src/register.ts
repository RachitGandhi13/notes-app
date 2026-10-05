import { hash } from "bcryptjs";
import { prisma } from "@repo/db/client";
import { checkRateLimit, MAX_PASSWORD_LENGTH } from "./config";
import { sendVerificationEmail } from "./verification";
import { AuthActionError } from "./action-error";

/**
 * Shared by both apps' /api/auth/register routes: validates, rate-limits,
 * creates the user, and sends a verification email (best-effort — see
 * email.ts). appUrl is the *calling* app's own URL, used to build the
 * verification link that hits that same app's /api/auth/verify-email.
 */
export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  ip: string;
  appUrl: string;
}): Promise<void> {
  const { name, email, password, ip, appUrl } = params;

  if (!email || !password || !name) {
    throw new AuthActionError(400, "Name, email and password are required.");
  }
  if (password.length < 8) {
    throw new AuthActionError(400, "Password must be at least 8 characters.");
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new AuthActionError(400, `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`);
  }
  if (name.length > 100) {
    throw new AuthActionError(400, "Name must be at most 100 characters.");
  }
  if (!checkRateLimit(`register:${ip}`, 5, 60_000)) {
    throw new AuthActionError(429, "Too many requests. Please wait a moment.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AuthActionError(409, "An account with this email already exists.");
  }

  const hashed = await hash(password, 10);
  await prisma.user.create({ data: { name, email, password: hashed } });

  await sendVerificationEmail({ email, name, appUrl });
}
