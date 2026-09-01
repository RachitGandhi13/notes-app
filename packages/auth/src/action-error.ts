/** Generic HTTP-status-carrying error for auth flows (register, password reset). */
export class AuthActionError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "AuthActionError";
  }
}
