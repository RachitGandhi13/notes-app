import { hash } from "bcryptjs";
import { prisma } from "@repo/db/client";
import { checkRateLimit } from "./config";
import { createVerificationToken, consumeVerificationToken } from "./tokens";
import { sendEmail } from "./email";
import { AuthActionError } from "./action-error";

/**
 * Always resolves without error, even if the email doesn't exist or SMTP
 * isn't configured — never reveal whether an account exists for a given
 * email address.
 */
export async function requestPasswordReset(
  email: string,
  ip: string,
  appUrl: string
): Promise<void> {
  if (!email) return;
  if (!checkRateLimit(`reset:${ip}`, 5, 60_000)) return;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const token = await createVerificationToken(email);
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  await sendEmail(
    email,
    "Reset your password",
    `<p>Click below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can ignore this email.</p>`
  );
}

export async function resetPassword(
  email: string,
  token: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 8) {
    throw new AuthActionError(400, "Password must be at least 8 characters.");
  }

  const valid = await consumeVerificationToken(email, token);
  if (!valid) {
    throw new AuthActionError(400, "This reset link is invalid or has expired.");
  }

  const hashed = await hash(newPassword, 10);
  await prisma.user.update({ where: { email }, data: { password: hashed } });
}
