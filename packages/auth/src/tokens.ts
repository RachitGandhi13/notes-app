import crypto from "crypto";
import { prisma } from "@repo/db/client";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Creates a random single-use token against the shared VerificationToken
 * table (identifier = email). Used for both email verification and
 * password-reset links — they don't collide since consumption checks the
 * exact (identifier, token) pair, not just the identifier.
 */
export async function createVerificationToken(identifier: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: { identifier, token, expires: new Date(Date.now() + TOKEN_TTL_MS) },
  });
  return token;
}

/**
 * Validates and deletes a token in one step (single-use). Returns false for
 * a missing, already-used, or expired token.
 */
export async function consumeVerificationToken(
  identifier: string,
  token: string
): Promise<boolean> {
  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier, token } },
  });
  if (!record || record.expires < new Date()) return false;

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier, token } },
  });
  return true;
}
