import { get } from "@vercel/blob";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isPrivateBlob } from "@/lib/recipe-photo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Streams a recipe's photo from the PRIVATE Vercel Blob store, gated by session.
// The blob URL is stored in Recipe.photoUrl; private blobs are not publicly
// reachable, so the browser <img> points here and we proxy the bytes. Images
// hosted elsewhere (public) just redirect.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });

  const { id } = await params;
  const recipe = await db.recipe.findUnique({
    where: { id },
    select: { photoUrl: true },
  });
  const photoUrl = recipe?.photoUrl?.trim();
  if (!photoUrl) return new Response(null, { status: 404 });

  if (!isPrivateBlob(photoUrl)) return Response.redirect(photoUrl, 307);

  const res = await get(photoUrl, { access: "private" });
  if (!res || res.statusCode !== 200) return new Response(null, { status: 404 });

  return new Response(res.stream, {
    headers: {
      "content-type": res.blob.contentType ?? "application/octet-stream",
      "cache-control": "private, max-age=3600",
    },
  });
}
