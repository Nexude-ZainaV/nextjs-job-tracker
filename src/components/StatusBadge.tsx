// Coloured pill for a job status, with light and dark variants.

import { STATUS_LABELS, type Status } from "@/lib/validation";

const STATUS_STYLES: Record<Status, string> = {
  wishlist: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  applied: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300",
  interview: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  offer: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  rejected: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
