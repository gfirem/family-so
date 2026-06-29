import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { anthropicToolSchemas, toolsByName } from "@/lib/assistant-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `Sos el asistente de family-so, el sistema operativo familiar de Guille y China.
Los ayudás a planificar, decidir, ejecutar y medir su vida en familia, sobre tres pilares clave: dormir, entrenar y comer (sistema 1-2-12).
Hablás SIEMPRE en español, con tono cálido, directo y orientado a la acción.
Usá las herramientas para leer datos reales (semana, hábitos, metas, recetas, estructura del día) antes de responder; no inventes números.
Aplicás Hábitos Atómicos: identidad antes que meta, diseño del entorno, regla "nunca fallar dos veces seguidas".
Sobre salud: sos informativo, NUNCA prescriptivo. No recomiendes el suero con sal del protocolo Unani ni ayunos/limpiezas; si surgen, decí que hay que validarlos con su médico. Esto no es consejo médico.
Los recordatorios reales se manejan con Google Calendar (no podés disparar alarmas).
Sé conciso: respuestas accionables, no párrafos largos.`;

type ClientMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        error:
          "El chat no está configurado todavía. Agregá ANTHROPIC_API_KEY en las variables de entorno (Vercel) para activarlo.",
      },
      { status: 503 },
    );
  }

  const body = (await req.json()) as { messages: ClientMessage[] };
  const client = new Anthropic();

  // Historial en formato de la Messages API.
  const messages: Anthropic.MessageParam[] = body.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const tools = anthropicToolSchemas();

  try {
    // Loop manual de tool use (acotado).
    for (let i = 0; i < 6; i++) {
      const response = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 4096,
        thinking: { type: "adaptive" },
        system: SYSTEM,
        tools,
        messages,
      });

      if (response.stop_reason === "tool_use") {
        // Ejecutar cada tool y devolver los resultados juntos.
        messages.push({ role: "assistant", content: response.content });
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const block of response.content) {
          if (block.type === "tool_use") {
            const tool = toolsByName.get(block.name);
            try {
              const result = tool
                ? await tool.handler((block.input ?? {}) as Record<string, unknown>)
                : `Herramienta desconocida: ${block.name}`;
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: result,
              });
            } catch (e) {
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: `Error: ${(e as Error).message}`,
                is_error: true,
              });
            }
          }
        }
        messages.push({ role: "user", content: toolResults });
        continue;
      }

      // Respuesta final: juntar el texto.
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return Response.json({ reply: text || "(sin respuesta)" });
    }

    return Response.json({
      reply: "Necesité demasiados pasos para responder. Probá reformular la pregunta.",
    });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      return Response.json({ error: `Error de la API: ${e.message}` }, { status: 502 });
    }
    return Response.json({ error: "Error inesperado en el chat." }, { status: 500 });
  }
}
