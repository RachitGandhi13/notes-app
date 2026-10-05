import { prisma } from "@repo/db/client";
import { checkRateLimit } from "./config";
import { createVerificationToken } from "./tokens";
import { sendEmail } from "./email";

/** Escapes text placed inside HTML, so a name like "<img src=x>" is shown as text. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Creates a fresh single-use link (valid for an hour) and emails it. */
export async function sendVerificationEmail(params: {
  email: string;
  name: string;
  appUrl: string;
}): Promise<void> {
  const { email, name, appUrl } = params;
  const token = await createVerificationToken(email);
  const verifyUrl = `${appUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  await sendEmail(
    email,
    "Verify your email",
    `<p>Hi ${escapeHtml(name)},</p><p>Click below to verify your email address:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 1 hour.</p>`
  );
}

/**
 * Sends a new verification link to an account that hasn't verified yet. It never reveals
 * whether the address has an account, so callers should show the same message either way.
 * Rate limited per IP and per address.
 */
export async function resendVerification(params: {
  email: string;
  ip: string;
  appUrl: string;
}): Promise<"sent" | "rate-limited" | "ignored"> {
  const { ip, appUrl } = params;
  const email = params.email.trim().toLowerCase();
  if (!email) return "ignored";
  if (!checkRateLimit(`resend-ip:${ip}`, 10, 60 * 60_000)) return "rate-limited";
  if (!checkRateLimit(`resend:${email}`, 3, 60 * 60_000)) return "rate-limited";

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { email: true, name: true, password: true, emailVerified: true },
  });
  // Only password accounts that are still unverified get a new link.
  if (!user || !user.email || !user.password || user.emailVerified) return "ignored";

  await sendVerificationEmail({ email: user.email, name: user.name ?? "there", appUrl });
  return "sent";
}
