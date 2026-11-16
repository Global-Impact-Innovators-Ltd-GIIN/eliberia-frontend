"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessagesSquare, Send } from "lucide-react";
import { api, fmtDateTime } from "@/lib/api";

type Msg = { id: number; body: string; sender_name: string; sender_role: string; mine: boolean; created_at: string };
const ROLE: Record<string, string> = { citizen: "Applicant", agent: "Agent", officer: "Officer", admin: "Administrator" };

export default function Messages({ appId, title = "Messages" }: { appId: number; title?: string }) {
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(() => api<Msg[]>(`/api/applications/${appId}/messages`).then(setMsgs).catch(() => setMsgs([])), [appId]);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }); }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const m = await api<Msg>(`/api/applications/${appId}/messages`, { method: "POST", json: { body } });
      setMsgs((x) => [...(x || []), m]); setBody("");
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <section className="card">
      <h2 className="flex items-center gap-2 font-bold"><MessagesSquare size={18} /> {title}</h2>
      <div ref={box} className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
        {msgs?.map((m) => (
          <div key={m.id} className={m.mine ? "flex justify-end" : ""}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.mine ? "rounded-br-md bg-navy-800 text-white" : "rounded-bl-md bg-slate-100"}`}>
              {!m.mine && <div className="text-xs font-semibold text-navy-800">{m.sender_name} · {ROLE[m.sender_role] || m.sender_role}</div>}
              <div className="whitespace-pre-wrap break-words">{m.body}</div>
              <div className={`mt-0.5 text-[11px] ${m.mine ? "text-navy-200" : "text-ink-500"}`}>{fmtDateTime(m.created_at)}</div>
            </div>
          </div>
        ))}
        {msgs?.length === 0 && <p className="muted">No messages yet. Ask a question about this application here.</p>}
      </div>
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input className="input" placeholder="Write a message" value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} aria-label="Message" />
        <button className="btn px-3.5" disabled={busy || body.trim().length < 2} aria-label="Send message"><Send size={16} /></button>
      </form>
      {error && <p className="mt-2 text-sm text-flag-700" role="alert">{error}</p>}
    </section>
  );
}
