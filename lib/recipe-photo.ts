// Chooses the correct <img> src for a recipe photo.
//
// Recipe images live in a PRIVATE Vercel Blob store, so their blob URLs are not
// directly loadable by the browser — they must be streamed through the
// session-gated proxy route (/api/recipe-photo/[id]). Images hosted elsewhere
// (e.g. an og:image captured during URL import) are public and load directly.
export function recipePhotoSrc(recipe: {
  id: string;
  photoUrl: string | null;
}): string | null {
  const url = recipe.photoUrl?.trim();
  if (!url) return null;
  if (isPrivateBlob(url)) return `/api/recipe-photo/${recipe.id}`;
  return url;
}

// A stored photo is served from Blob (needs the proxy) unless it's an external
// http(s) URL on some other host.
export function isPrivateBlob(photoUrl: string): boolean {
  const url = photoUrl.trim();
  const isExternal = /^https?:\/\//i.test(url) && !/\.blob\.vercel-storage\.com/i.test(url);
  return !isExternal;
}
