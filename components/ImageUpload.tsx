"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";

// Uploads an image straight to Vercel Blob from the browser and writes the
// resulting public URL into a hidden field, so the surrounding Server Action
// form submits it as a plain string — the file never streams through our server
// (no multipart, no serverless body limit). `name` is the form field the URL is
// stored under ("image" for the family photo, "photoUrl" for a recipe).
export function ImageUpload({
  name,
  defaultValue = "",
  shape = "square",
}: {
  name: string;
  defaultValue?: string;
  shape?: "square" | "wide";
}) {
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
      });
      setUrl(blob.url);
    } catch {
      setError("No se pudo subir la imagen. Probá de nuevo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const previewClass =
    shape === "wide"
      ? "h-32 w-full rounded-2xl object-cover"
      : "h-16 w-16 rounded-2xl object-cover";

  return (
    <div className="space-y-2">
      {/* The value actually submitted with the form. */}
      <input type="hidden" name={name} value={url} />

      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className={previewClass} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn-ghost"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? "Subiendo…" : url ? "Cambiar foto" : "Subir foto"}
        </button>
        {url && !uploading && (
          <button
            type="button"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-danger)]"
            onClick={() => setUrl("")}
          >
            Quitar
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
        />
      </div>

      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
