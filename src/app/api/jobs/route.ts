// REST collection endpoint: list jobs (with filters) and create a job.

import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { createJob, listJobs } from "@/lib/jobs";
import { isStatus, validateJob } from "@/lib/validation";

// GET /api/jobs?status=applied&q=acme
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const status = params.get("status");
  if (status !== null && !isStatus(status)) {
    return Response.json({ error: `Unknown status "${status}"` }, { status: 400 });
  }
  const jobs = listJobs(getDb(), { status: status ?? undefined, search: params.get("q") ?? undefined });
  return Response.json({ jobs });
}

// POST /api/jobs  { "company": "...", "role": "...", "status": "applied", ... }
export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Body must be a JSON object" }, { status: 400 });
  }
  const result = validateJob(body);
  if (!result.success) return Response.json({ errors: result.errors }, { status: 422 });

  const job = createJob(getDb(), result.data);
  return Response.json({ job }, { status: 201, headers: { Location: `/api/jobs/${job.id}` } });
}
