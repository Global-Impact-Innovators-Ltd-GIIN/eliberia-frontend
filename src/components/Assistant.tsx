"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MessageCircleQuestion, Send, X } from "lucide-react";
import { api } from "@/lib/api";

type Msg = { from: "you" | "bot"; text: string; services?: { code: string; name: string }[] };
const SUGGEST = ["How much is a passport?", "How do I pay?", "Can I apply for my child?", "Do I need to visit an office?"];

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "Hello! Ask me about any service - fees, documents, how long it takes, or how to pay." },
  ]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  async function ask(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setQ(""); setBusy(true);
    setMsgs((m) => [...m, { from: "you", text: t }]);
    try {
      const r = await api<{ answer: string; services: Msg["services"] }>("/api/assistant", { method: "POST", json: { q: t } });
      setMsgs((m) => [...m, { from: "bot", text: r.answer, services: r.services }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { from: "bot", text: e.message }]);
    } finally { setBusy(false); }
  }

  return (
    <div className="no-print fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 flex h-[28rem] w-[min(22rem,calc(100vw-2.5rem))] animate-rise flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift" role="dialog" aria-label="eLiberia help assistant">
          <div className="flex items-center justify-between bg-navy-800 px-4 py-3 text-white">
            <div><div className="text-sm font-semibold">Ask eLiberia</div><div className="text-xs text-navy-200">Answers from the official service catalog</div></div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-lg p-1 hover:bg-white/10"><X size={18} /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {msgs.map((m, i) => (
              <div key={i} className={m.from === "you" ? "flex justify-end" : ""}>
                <div className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${m.from === "you" ? "rounded-br-md bg-navy-800 text-white" : "rounded-bl-md bg-slate-100 text-ink-900"}`}>
                  {m.text}
                  {!!m.services?.length && (
                    <div className="mt-2 flex flex-col gap-1">
                      {m.services.map((s) => <Link key={s.code} href={`/services/${s.code}`} onClick={() => setOpen(false)} className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-800 ring-1 ring-slate-200 hover:ring-navy-400">{s.name} →</Link>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {msgs.length === 1 && (
              <div className="flex flex-wrap gap-1.5">
                {SUGGEST.map((s) => <button key={s} onClick={() => ask(s)} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-ink-700 hover:border-navy-400">{s}</button>)}
              </div>
            )}
            {busy && <div className="text-xs text-ink-500">Looking that up…</div>}
            <div ref={end} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="flex gap-2 border-t border-slate-200 p-2.5">
            <input className="input" placeholder="Type your question" value={q} onChange={(e) => setQ(e.target.value)} maxLength={300} aria-label="Your question" />
            <button className="btn px-3" disabled={busy || !q.trim()} aria-label="Send"><Send size={16} /></button>
          </form>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="ml-auto flex items-center gap-2 rounded-full bg-navy-800 px-4 py-3 text-sm font-semibold text-white shadow-lift transition hover:bg-navy-700" aria-expanded={open}>
        <MessageCircleQuestion size={18} /> {open ? "Close" : "Ask eLiberia"}
      </button>
    </div>
  );
}
