"use client";

import { useRef, useState } from "react";
import { PageHeader, Card } from "@/components/ui";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "¿Cómo venimos con los hábitos esta semana?",
  "Armame ideas para el plan del finde",
  "¿Qué recetas sin lácteos tenemos aprobadas?",
  "¿Cuáles son nuestras metas del trimestre?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setError(null);
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Algo salió mal.");
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("No pude conectar con el asistente.");
    } finally {
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <>
      <PageHeader
        emoji="💬"
        title="Asistente"
        subtitle="Preguntale sobre tu semana, hábitos, comida y metas. Lee tus datos reales."
      />

      {messages.length === 0 && (
        <Card className="mb-4">
          <p className="mb-3 text-sm text-[var(--color-muted)]">Probá con:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="chip hover:bg-[var(--color-bg)]">
                {s}
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="mb-4 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-[var(--color-brand-600)] text-white"
                  : "border border-[var(--color-line)] bg-white"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-2.5 text-sm text-[var(--color-muted)]">
              Pensando…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && (
        <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-20 flex gap-2 md:bottom-0"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribí tu mensaje…"
          className="input flex-1"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary">
          Enviar
        </button>
      </form>
    </>
  );
}
