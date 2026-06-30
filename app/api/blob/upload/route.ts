import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Issues short-lived client-upload tokens for Vercel Blob. The browser uploads
// images directly to Blob, so only this small JSON token request reaches our
// server — which sidesteps the Server Action / serverless body-size limit and
// the multipart parsing issues that plague file uploads.
//
// Authorization is enforced in onBeforeGenerateToken: only signed-in users get a
// token, and only image content types within a size cap are allowed. This route
// runs its own auth (it does not depend on the global auth middleware).
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth();
        if (!session?.user?.id) {
          throw new Error("No autorizado");
        }
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/avif",
          ],
          maximumSizeInBytes: 10 * 1024 * 1024, // 10 MB
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Nothing to do: the URL is persisted when the surrounding form is
        // submitted. (This callback can't reach localhost during dev anyway.)
      },
    });

    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error de subida" },
      { status: 400 },
    );
  }
}
