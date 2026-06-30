import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { SubmitButton } from "@/components/actions-ui";
import { NutritionTabs } from "../Tabs";
import { importRecipeFromUrl, importRecipeFromPdf, importPdfFromUrl } from "../actions";

const ERRORS: Record<string, string> = {
  "falta-url": "Pegá una URL para importar.",
  "url-invalida": "La URL no es válida.",
  "falta-pdf": "Elegí un archivo PDF.",
  "no-pdf": "El archivo debe ser un PDF.",
  "pdf-grande": "El PDF es demasiado grande (máx. 32 MB).",
  "sin-recetas": "No encontramos recetas en ese origen. Probá con otra página o PDF.",
  import: "No se pudo importar. Revisá el origen e intentá de nuevo.",
};

export default async function ImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <>
      <PageHeader
        emoji="📥"
        title="Importar recetas"
        subtitle="Cargá un PDF del recetario o pegá el link de una receta. La IA las estructura sola."
      />
      <NutritionTabs />

      {error && (
        <div className="mb-5 rounded-xl border border-[var(--color-line)] bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {ERRORS[error] ?? "Ocurrió un error."}
        </div>
      )}

      <Card className="mb-5">
        <SectionTitle>Desde una URL</SectionTitle>
        <form action={importRecipeFromUrl} className="flex flex-wrap gap-2">
          <input
            name="url"
            type="url"
            placeholder="https://… (página de la receta)"
            className="input flex-1"
            required
          />
          <SubmitButton>Importar URL</SubmitButton>
        </form>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Leemos la página, extraemos la receta (ingredientes, pasos, macros) y, si hay, tomamos la
          foto principal.
        </p>
      </Card>

      <Card className="mb-5">
        <SectionTitle>Desde un PDF (archivo)</SectionTitle>
        <form action={importRecipeFromPdf} className="space-y-2">
          <input
            name="pdf"
            type="file"
            accept="application/pdf"
            className="input"
            required
          />
          <SubmitButton>Importar PDF</SubmitButton>
        </form>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Procesamos TODO el recetario y creamos cada receta por separado. En producción la subida
          directa está limitada a ~4.5 MB; para recetarios grandes usá «PDF por URL» abajo.
        </p>
      </Card>

      <Card className="mb-5">
        <SectionTitle>Desde un PDF (por URL)</SectionTitle>
        <form action={importPdfFromUrl} className="flex flex-wrap gap-2">
          <input
            name="pdfUrl"
            type="url"
            placeholder="https://… (link público y directo al PDF)"
            className="input flex-1"
            required
          />
          <SubmitButton>Importar PDF por URL</SubmitButton>
        </form>
        <p className="mt-2 text-xs text-[var(--color-muted)]">
          Sin límite de tamaño: la IA lee el PDF directo desde la URL. El link debe ser
          público y apuntar directo al archivo (no una página de previsualización).
        </p>
      </Card>

      <p className="text-xs text-[var(--color-muted)]">
        Las recetas importadas entran como <strong>borrador</strong>: revisalas y aprobalas en
        Recetas antes de usarlas en el plan.
      </p>
    </>
  );
}
