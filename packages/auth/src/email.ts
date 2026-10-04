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
 * Sends a transactional email. In production a missing SMTP setup is an error,
 * because a verification or reset email that never arrives leaves the account
 * unusable. In development, the email is printed instead so you can read the link.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP_HOST is not set. Transactional email cannot be sent.");
    }
    if (process.env.NODE_ENV === "development") {
      // Dev only: shows the subject and body (which contains the link) in the terminal.
      console.info(`[email:dev] "${subject}" -> ${to}\n${html}`);
    }
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
    // Logged, not thrown: callers create the account before sending, so a throw
    // here would leave an account that exists but was never verified. The
    // recipient address is not logged, because production logs are long-lived.
    console.error("[email] Failed to send:", err instanceof Error ? err.message : "unknown error");
  }
}
