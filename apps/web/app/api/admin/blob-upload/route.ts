import { NextResponse } from "next/server";
import path from "path";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { AuthError, requireAdmin } from "@repo/auth";
import { HttpError } from "@/lib/security";
import { directUploadRules, type MediaKind } from "@/lib/upload-types";

// Issues the short-lived token the browser needs to upload straight to Vercel Blob. The file
// itself never passes through this server, so a 500 MB lecture doesn't need memory here.
//
// The browser asks for a token (blob.generate-client-token). Only that request needs an admin
// session. Vercel then calls this same URL once an upload finishes (blob.upload-completed),
// signed with the store token rather than a browser cookie, so that path is not gated by
// requireAdmin. The file is checked later, by /api/admin/blob-verify.

function parseKind(clientPayload: string | null): MediaKind {
  try {
    const kind = JSON.parse(clientPayload ?? "{}")?.kind;
    if (kind === "image" || kind === "video") return kind;
  } catch {
    // Fall through to the error below.
  }
  throw new HttpError(400, "Unknown upload type.");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    // Checked before handleUpload runs. It reads the storage token first, so checking inside the
    // callback would answer an anonymous request with a storage error instead of 401.
    if (body.type === "blob.generate-client-token") {
      await requireAdmin();
    }

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const kind = parseKind(clientPayload);
        const rules = directUploadRules(kind);
        const ext = path.posix.extname(pathname).toLowerCase();
        if (
          !pathname.startsWith(`${rules.folder}/`) ||
          pathname.includes("..") ||
          !rules.extensions.includes(ext)
        ) {
          throw new HttpError(400, "That file type is not allowed here.");
        }

        return {
          allowedContentTypes: rules.contentTypes,
          maximumSizeInBytes: rules.maxBytes,
          // Each upload gets a unique name, so a re-uploaded file never overwrites another.
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Nothing to record here. The admin page saves the record after the file is verified.
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError || err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[blob-upload]", err);
    return NextResponse.json({ error: "Could not start the upload." }, { status: 400 });
  }
}
