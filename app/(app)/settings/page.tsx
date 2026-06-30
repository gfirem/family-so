import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { ActionButton, SubmitButton } from "@/components/actions-ui";
import { ImageUpload } from "@/components/ImageUpload";
import { requireUser } from "@/lib/session";
import { getFamily } from "@/lib/family";
import { updateFamily, addMember, updateMember, removeMember } from "./actions";

export default async function SettingsPage() {
  const me = await requireUser();
  const family = await getFamily();
  const members = family.members;

  return (
    <>
      <PageHeader
        emoji="⚙️"
        title="Ajustes"
        subtitle="Configurá la familia y sus miembros."
      />

      {/* Family identity */}
      <Card className="mb-5">
        <SectionTitle>La familia</SectionTitle>
        <form action={updateFamily} className="space-y-3">
          <input
            name="name"
            defaultValue={family.name}
            placeholder="Nombre de la familia"
            className="input"
            required
          />
          <div>
            <label className="mb-1 block text-xs text-[var(--color-muted)]">
              Foto de la familia (opcional)
            </label>
            <ImageUpload name="image" defaultValue={family.image ?? ""} />
          </div>
          <SubmitButton>Guardar</SubmitButton>
        </form>
      </Card>

      {/* Members */}
      <Card>
        <SectionTitle>Miembros</SectionTitle>
        <ul className="divide-y divide-[var(--color-line)]">
          {members.map((m) => (
            <li key={m.id} className="py-3">
              <form action={updateMember} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={m.id} />
                {m.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.image} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg)] text-sm font-semibold">
                    {m.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <input name="name" defaultValue={m.name} className="input w-36 flex-1" required />
                <span className="text-xs text-[var(--color-muted)]">{m.email}</span>
                <SubmitButton className="btn-ghost">Guardar</SubmitButton>
                {m.id !== me.id && members.length > 1 && (
                  <ActionButton
                    id={m.id}
                    action={removeMember}
                    confirm={`¿Quitar a ${m.name}? Se borran sus hábitos, pesos y plannings privadas.`}
                  >
                    Quitar
                  </ActionButton>
                )}
              </form>
            </li>
          ))}
        </ul>

        <form action={addMember} className="mt-3 space-y-2 border-t border-[var(--color-line)] pt-3">
          <p className="text-sm font-medium">Agregar miembro</p>
          <div className="flex flex-wrap gap-2">
            <input name="name" placeholder="Nombre" className="input w-36 flex-1" required />
            <input
              name="email"
              type="email"
              placeholder="Email de Google"
              className="input w-48 flex-1"
              required
            />
          </div>
          <p className="text-xs text-[var(--color-muted)]">
            El email debe coincidir con su cuenta de Google para que pueda iniciar sesión.
          </p>
          <SubmitButton className="btn-ghost">Agregar</SubmitButton>
        </form>
      </Card>
    </>
  );
}
