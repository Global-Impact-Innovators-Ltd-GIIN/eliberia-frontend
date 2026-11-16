"use client";
import { useCallback, useEffect, useState } from "react";
import { Bell as BellIcon } from "lucide-react";
import { api, fmtDateTime } from "@/lib/api";

type Note = { id: number; title: string; body: string; read: boolean; created_at: string };

export default function Bell() {
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[] | null>(null);

  const count = useCallback(() => api<{ unread: number }>("/api/notifications/count").then((r) => setUnread(r.unread)).catch(() => {}), []);
  useEffect(() => { count(); const t = setInterval(count, 60000); return () => clearInterval(t); }, [count]);

  async function toggle() {
    const next = !open; setOpen(next);
    if (!next) return;
    try {
      setNotes(await api<Note[]>("/api/notifications"));
      if (unread) { await api("/api/notifications/read", { method: "POST" }); setUnread(0); }
    } catch { setNotes([]); }
  }

  return (
    <div className="relative">
      <button onClick={toggle} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open}
        className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-ink-700 transition hover:border-navy-200 hover:text-navy-800">
        <BellIcon size={18} />
        {unread > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-flag-600 px-1 text-[11px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] animate-rise overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lift">
          <div className="border-b border-slate-100 px-4 py-2.5 text-sm font-bold">Notifications</div>
          <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {notes === null && <li className="muted px-4 py-3">Loading…</li>}
            {notes?.length === 0 && <li className="muted px-4 py-3">You&apos;re all caught up.</li>}
            {notes?.slice(0, 15).map((n) => (
              <li key={n.id} className={`px-4 py-3 text-sm ${n.read ? "" : "bg-navy-50/60"}`}>
                <div className="font-semibold">{n.title}</div>
                <div className="text-ink-700">{n.body}</div>
                <div className="mt-0.5 text-xs text-ink-500">{fmtDateTime(n.created_at)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
