import { NextResponse } from "next/server";

// Liveness probe for the container platform (Lightsail / App Runner / ECS).
// Deliberately does no work: no database, Redis or other service calls. A
// failing dependency must not make the platform restart a container that is
// otherwise serving requests.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
