import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { updateJobAction } from "@/app/actions";
import { DeleteJobButton } from "@/components/DeleteJobButton";
import { JobForm } from "@/components/JobForm";
import { StatusBadge } from "@/components/StatusBadge";
import { getDb } from "@/lib/db";
import { getJob, parseId } from "@/lib/jobs";

async function loadJob(idParam: string) {
  await connection(); // node:sqlite is synchronous: opt out of prerendering explicitly
  const id = parseId(idParam);
  const job = id === undefined ? undefined : getJob(getDb(), id);
  if (!job) notFound();
  return job;
}

export async function generateMetadata(props: PageProps<"/jobs/[id]">): Promise<Metadata> {
  const job = await loadJob((await props.params).id);
  return { title: `${job.role} at ${job.company}` };
}

export default async function JobPage(props: PageProps<"/jobs/[id]">) {
  const job = await loadJob((await props.params).id);
  const { saved } = await props.searchParams;

  return (
    <div className="grid max-w-3xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <h2 className="text-xl font-semibold">
            {job.role} <span className="text-slate-500">at {job.company}</span>
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <StatusBadge status={job.status} />
            {job.url && (
              // rel=noopener noreferrer: the external page gets no handle on this window.
              <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                View posting ↗
              </a>
            )}
          </div>
        </div>
        <DeleteJobButton id={job.id} label={`${job.role} at ${job.company}`} />
      </div>

      {saved === "1" && (
        <p role="status" className="rounded-lg bg-emerald-50 px-4 py-2 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Application added.
        </p>
      )}

      <JobForm action={updateJobAction.bind(null, job.id)} job={job} submitLabel="Save changes" />

      <Link href="/" className="text-sm text-slate-600 underline dark:text-slate-400">
        ← Back to all applications
      </Link>
    </div>
  );
}
