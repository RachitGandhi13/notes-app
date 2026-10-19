import { sendEmail } from "./email";
import { escapeHtml } from "./verification";

// Branded transactional emails. All four go through the same sendEmail() as the existing
// verification/reset emails — same SMTP transport, same "log instead of send in dev
// without SMTP_HOST, never throw" behavior, so none of these calls need their own
// try/catch: a failure here is logged and swallowed, never breaks the caller's flow.

function wrapEmail(
  heading: string,
  bodyHtml: string,
  cta?: { label: string; url: string }
): string {
  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e;">
      <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
        <span style="color:#fff;font-size:18px;font-weight:700;">CloudVidya Academy</span>
      </div>
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;padding:32px 28px;border-radius:0 0 12px 12px;">
        <h2 style="margin-top:0;font-size:18px;">${heading}</h2>
        ${bodyHtml}
        ${
          cta
            ? `<p style="text-align:center;margin-top:28px;"><a href="${cta.url}" style="background:#3b82f6;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">${escapeHtml(cta.label)}</a></p>`
            : ""
        }
      </div>
      <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:16px;">CloudVidya Academy</p>
    </div>
  `;
}

/** Trigger: a new account is created (Credentials signup, or OAuth via events.createUser). */
export async function sendWelcomeEmail(params: { email: string; name: string; appUrl: string }) {
  const { email, name, appUrl } = params;
  await sendEmail(
    email,
    "Welcome to CloudVidya Academy! 🚀",
    wrapEmail(
      `Welcome, ${escapeHtml(name)}!`,
      `<p>Your account is ready. Browse our hands-on Cloud &amp; DevOps courses, or head to your profile dashboard to pick up where you left off.</p>`,
      { label: "Browse courses", url: `${appUrl}/#browse` }
    )
  );
}

/** Trigger: grantOrderAccess() grants a course the student didn't already own. */
export async function sendEnrollmentEmail(params: {
  email: string;
  name: string;
  courseTitle: string;
  courseSlug: string;
  appUrl: string;
}) {
  const { email, name, courseTitle, courseSlug, appUrl } = params;
  await sendEmail(
    email,
    `Enrollment Confirmed: ${courseTitle} 🎉`,
    wrapEmail(
      "You're enrolled!",
      `<p>Hi ${escapeHtml(name)}, congratulations — your enrollment in <strong>${escapeHtml(courseTitle)}</strong> is now active, with lifetime access.</p>`,
      { label: "Start learning", url: `${appUrl}/courses/${courseSlug}` }
    )
  );
}

/** Trigger: submitInternshipApplication() successfully saves a new application. */
export async function sendInternshipApplicationReceivedEmail(params: {
  email: string;
  name: string;
  trackName: string;
}) {
  const { email, name, trackName } = params;
  await sendEmail(
    email,
    "Internship Application Received – CloudVidya Academy",
    wrapEmail(
      "Application received",
      `<p>Hi ${escapeHtml(name)}, thanks for applying to the <strong>${escapeHtml(trackName)}</strong> internship track. Our team is reviewing your application and will get back to you soon with an update.</p>`
    )
  );
}

/** Trigger: issueCertificate() newly issues a certificate (not a repeat click). */
export async function sendInternshipAccessGrantedEmail(params: {
  email: string;
  name: string;
  trackName: string;
  studentId: string | null;
  grantedCourseTitles: string[];
  appUrl: string;
}) {
  const { email, name, trackName, studentId, grantedCourseTitles, appUrl } = params;
  const courseList =
    grantedCourseTitles.length > 0
      ? `<p>You now have access to:</p><ul>${grantedCourseTitles.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`
      : "";
  await sendEmail(
    email,
    "Congratulations! Your Internship Access is Granted 🎓",
    wrapEmail(
      "You're in!",
      `<p>Hi ${escapeHtml(name)}, your internship access for the <strong>${escapeHtml(trackName)}</strong> track has been approved.</p>
       ${studentId ? `<p>Your Student ID: <strong>${escapeHtml(studentId)}</strong></p>` : ""}
       ${courseList}`,
      { label: "Log in and start learning", url: `${appUrl}/auth` }
    )
  );
}
