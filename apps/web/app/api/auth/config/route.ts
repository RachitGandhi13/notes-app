import { NextResponse } from "next/server";
import { enabledOAuthProviders } from "@repo/auth";

// Tells the sign-in page which social buttons to show. Only the enabled flags are returned,
// never the IDs or secrets.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(enabledOAuthProviders());
}
