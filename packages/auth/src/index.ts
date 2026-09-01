/* eslint-disable @typescript-eslint/triple-slash-reference -- see comment below: `import` breaks webpack bundling here, this is deliberate */
/// <reference path="./types.d.ts" />
// Triple-slash reference (not a real import) pulls the Session/JWT module
// augmentation (adding `id`/`admin` to session.user) into any consumer's TS
// program. Without this, the augmentation only applies when compiling this
// package in isolation — every consuming app's own tsc run (and `next
// build`, which fails the build on type errors) can't see it otherwise,
// since it's a pure ambient .d.ts that nothing imports and that lives
// outside each app's own tsconfig `include` glob. A plain `import "./types"`
// looks like it'd work too, but webpack tries to bundle it as a real module
// and fails since there's no runtime file to resolve — the triple-slash
// form is compile-time-only for TypeScript and invisible to bundlers.

export { authOptions, checkRateLimit } from "./config";
export { getSession, requireAuth, requireAdmin, AuthError } from "./helpers";
export { AuthActionError } from "./action-error";
export { createVerificationToken, consumeVerificationToken } from "./tokens";
export { sendEmail } from "./email";
export { registerUser } from "./register";
export { requestPasswordReset, resetPassword } from "./password-reset";
export type { Session } from "next-auth";
