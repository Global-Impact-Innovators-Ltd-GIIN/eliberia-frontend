import { AppEvent, STATUS_LABEL } from "@/lib/api";

export default function Timeline({ events }: { events: AppEvent[] }) {
  return (
    <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
      {[...events].reverse().map((e, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-lib-blue" />
          <div className="text-sm font-semibold">{STATUS_LABEL[e.status] || e.status}</div>
          <div className="text-sm text-slate-600">{e.message}</div>
          <div className="text-xs text-slate-400">{new Date(e.created_at + "Z").toLocaleString()}{e.actor ? ` · ${e.actor}` : ""}</div>
        </li>
      ))}
    </ol>
  );
}
