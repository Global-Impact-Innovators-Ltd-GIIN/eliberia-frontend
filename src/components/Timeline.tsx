import { AppEvent, fmtDateTime, STATUS_LABEL } from "@/lib/api";

export default function Timeline({ events }: { events: AppEvent[] }) {
  const list = [...events].reverse();
  return (
    <ol className="relative space-y-5 pl-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-slate-200">
      {list.map((e, i) => (
        <li key={i} className="relative">
          <span className={`absolute -left-6 top-1 h-[15px] w-[15px] rounded-full border-[3px] border-white ${i === 0 ? "bg-navy-800 ring-2 ring-navy-200" : "bg-slate-300"}`} />
          <div className="text-sm font-semibold text-ink-900">{STATUS_LABEL[e.status] || e.status}</div>
          <div className="text-sm text-ink-700">{e.message}</div>
          <div className="mt-0.5 text-xs text-ink-500">{fmtDateTime(e.created_at)}{e.actor ? ` · ${e.actor}` : ""}</div>
        </li>
      ))}
    </ol>
  );
}
