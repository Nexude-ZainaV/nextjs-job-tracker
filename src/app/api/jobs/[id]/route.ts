// REST item endpoint: read, replace and delete one job by id.

import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { deleteJob, getJob, parseId, updateJob } from "@/lib/jobs";
import { validateJob } from "@/lib/validation";

const notFound = () => Response.json({ error: "Job not found" }, { status: 404 });

export async function GET(_request: NextRequest, context: RouteContext<"/api/jobs/[id]">) {
  const id = parseId((await context.params).id);
  const job = id === undefined ? undefined : getJob(getDb(), id);
  return job ? Response.json({ job }) : notFound();
}

// PUT replaces the whole record (every required field must be sent).
export async function PUT(request: NextRequest, context: RouteContext<"/api/jobs/[id]">) {
  const id = parseId((await context.params).id);
  if (id === undefined) return notFound();

  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Body must be a JSON object" }, { status: 400 });
  }
  const result = validateJob(body);
  if (!result.success) return Response.json({ errors: result.errors }, { status: 422 });

  const job = updateJob(getDb(), id, result.data);
  return job ? Response.json({ job }) : notFound();
}

export async function DELETE(_request: NextRequest, context: RouteContext<"/api/jobs/[id]">) {
  const id = parseId((await context.params).id);
  return id !== undefined && deleteJob(getDb(), id) ? new Response(null, { status: 204 }) : notFound();
}
