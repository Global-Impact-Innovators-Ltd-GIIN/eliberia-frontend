import { STATUS_COLOR, STATUS_LABEL } from "@/lib/api";

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[status] || "bg-slate-100"}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}
