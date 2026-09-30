import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { getDb } from "@/lib/db";
import { jobStats, listJobs } from "@/lib/jobs";
import { isStatus, STATUSES, STATUS_LABELS } from "@/lib/validation";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function salaryRange(min?: number, max?: number): string {
  if (min === undefined && max === undefined) return "";
  if (min !== undefined && max !== undefined) return `${money.format(min)} – ${money.format(max)}`;
  return min !== undefined ? `from ${money.format(min)}` : `up to ${money.format(max!)}`;
}

// Reading searchParams makes this page render per request, so it always shows current data.
export default async function DashboardPage(props: PageProps<"/">) {
  const params = await props.searchParams;
  const status = isStatus(params.status) ? params.status : undefined;
  const search = typeof params.q === "string" ? params.q.slice(0, 100) : "";

  const db = getDb();
  const jobs = listJobs(db, { status, search });
  const stats = jobStats(db);

  return (
    <div className="grid gap-8">
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">
          Summary
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Total" value={stats.total} />
          {STATUSES.map((s) => (
            <Stat key={s} label={STATUS_LABELS[s]} value={stats.byStatus[s]} />
          ))}
        </dl>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Response rate: <strong>{stats.responseRatePct}%</strong> of submitted applications moved past &ldquo;Applied&rdquo;.
        </p>
      </section>

      <section aria-labelledby="list-heading" className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="list-heading" className="text-lg font-semibold">
            Applications
          </h2>
          {/* A plain GET form: filters live in the URL, so they are bookmarkable and work without JS. */}
          <form className="flex flex-wrap gap-2" role="search">
            <label className="sr-only" htmlFor="q">
              Search company, role or location
            </label>
            <input id="q" name="q" type="search" defaultValue={search} placeholder="Search…" className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900" />
            <label className="sr-only" htmlFor="status">
              Status
            </label>
            <select id="status" name="status" defaultValue={status ?? ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <button className="rounded-lg border border-slate-300 px-4 py-2 font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Filter</button>
          </form>
        </div>

        {jobs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600 dark:border-slate-700 dark:text-slate-400">
            {stats.total === 0 ? (
              <>
                No applications yet. <Link href="/jobs/new" className="font-medium text-indigo-600 underline">Add your first one</Link>.
              </>
            ) : (
              "No applications match these filters."
            )}
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="grid h-full gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-400 hover:shadow dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{job.role}</p>
                      <p className="text-slate-600 dark:text-slate-400">{job.company}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="text-sm text-slate-500">
                    {[job.location, salaryRange(job.salaryMin, job.salaryMax), job.appliedOn && `applied ${job.appliedOn}`].filter(Boolean).join(" · ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-2xl font-semibold">{value}</dd>
    </div>
  );
}
