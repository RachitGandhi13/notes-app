import nodemailer from "nodemailer";

function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_PORT === "465",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

/**
 * Best-effort email sender — mirrors @repo/cache's pattern: if SMTP isn't
 * configured (e.g. before Phase 1 credentials exist) this logs and no-ops
 * instead of throwing, so register/reset flows keep working end-to-end.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.warn(`[email] SMTP not configured — would have sent "${subject}" to ${to}`);
    return;
  }
  try {
    await getTransport().sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.warn("[email] Failed to send:", err);
  }
}
