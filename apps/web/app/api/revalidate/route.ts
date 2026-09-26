import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// Webhook-style ISR revalidation.
// Call: POST /api/revalidate?secret=<REVALIDATE_SECRET>&path=/
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const path = searchParams.get("path") ?? "/";

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret." }, { status: 401 });
  }

  revalidatePath(path);
  return NextResponse.json({ revalidated: true, path });
}
