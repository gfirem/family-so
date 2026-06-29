import { assistantTools, toolsByName } from "@/lib/assistant-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// MCP (Model Context Protocol) server over HTTP/JSON-RPC.
// Exposes family-so data as tools so that Claude (or another
// MCP client) can read/write it from outside the app.
// Authenticated with a bearer token (MCP_TOKEN).

const PROTOCOL_VERSION = "2025-06-18";

type JsonRpc = { jsonrpc: "2.0"; id?: number | string | null; method: string; params?: unknown };

function result(id: unknown, value: unknown) {
  return { jsonrpc: "2.0", id, result: value };
}
function rpcError(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function unauthorized() {
  return Response.json({ error: "No autorizado" }, { status: 401 });
}

async function handleOne(msg: JsonRpc): Promise<object | null> {
  switch (msg.method) {
    case "initialize":
      return result(msg.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "family-so", version: "0.1.0" },
      });

    case "notifications/initialized":
      return null; // notification: no response

    case "ping":
      return result(msg.id, {});

    case "tools/list":
      return result(msg.id, {
        tools: assistantTools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema,
        })),
      });

    case "tools/call": {
      const params = (msg.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
      const tool = params.name ? toolsByName.get(params.name) : undefined;
      if (!tool) {
        return rpcError(msg.id, -32602, `Herramienta desconocida: ${params.name}`);
      }
      try {
        const text = await tool.handler(params.arguments ?? {});
        return result(msg.id, { content: [{ type: "text", text }] });
      } catch (e) {
        return result(msg.id, {
          content: [{ type: "text", text: `Error: ${(e as Error).message}` }],
          isError: true,
        });
      }
    }

    default:
      return rpcError(msg.id, -32601, `Método no soportado: ${msg.method}`);
  }
}

export async function POST(req: Request) {
  const token = process.env.MCP_TOKEN;
  if (token) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${token}`) return unauthorized();
  }

  let payload: JsonRpc | JsonRpc[];
  try {
    payload = await req.json();
  } catch {
    return Response.json(rpcError(null, -32700, "JSON inválido"), { status: 400 });
  }

  if (Array.isArray(payload)) {
    const out = [];
    for (const m of payload) {
      const r = await handleOne(m);
      if (r) out.push(r);
    }
    return Response.json(out);
  }

  const r = await handleOne(payload);
  if (!r) return new Response(null, { status: 202 });
  return Response.json(r);
}

// Basic discovery: signals that the MCP endpoint exists (no GET stream support).
export function GET() {
  return Response.json({
    name: "family-so",
    transport: "streamable-http (json-rpc over POST)",
    protocolVersion: PROTOCOL_VERSION,
  });
}
