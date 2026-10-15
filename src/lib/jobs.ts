// Repository for the jobs table: every query against it lives here.

import type { DatabaseSync, SQLInputValue } from "node:sqlite";
import { STATUSES, type JobInput, type Status } from "./validation";

export interface Job extends JobInput {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobFilters {
  status?: Status;
  search?: string;
}

export interface JobStats {
  total: number;
  byStatus: Record<Status, number>;
  /** Share of submitted applications that got past "applied" (interview, offer or rejection). */
  responseRatePct: number;
}

type JobRow = {
  id: number;
  company: string;
  role: string;
  status: Status;
  location: string;
  url: string;
  salary_min: number | null;
  salary_max: number | null;
  applied_on: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

// snake_case row -> camelCase Job; NULL salary becomes undefined, NULL date becomes "".
function toJob(row: JobRow): Job {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    status: row.status,
    location: row.location,
    url: row.url,
    salaryMin: row.salary_min ?? undefined,
    salaryMax: row.salary_max ?? undefined,
    appliedOn: row.applied_on ?? "",
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// The reverse for writes: a missing salary or date is stored as NULL.
function toParams(input: JobInput) {
  return {
    company: input.company,
    role: input.role,
    status: input.status,
    location: input.location,
    url: input.url,
    salary_min: input.salaryMin ?? null,
    salary_max: input.salaryMax ?? null,
    applied_on: input.appliedOn || null,
    notes: input.notes,
  };
}

// All queries use bound parameters (:name / ?), so input never becomes SQL.

export function listJobs(db: DatabaseSync, filters: JobFilters = {}): Job[] {
  const where: string[] = [];
  const params: Record<string, SQLInputValue> = {};
  if (filters.status) {
    where.push("status = :status");
    params.status = filters.status;
  }
  const search = filters.search?.trim();
  if (search) {
    where.push("(company LIKE :search ESCAPE '\\' OR role LIKE :search ESCAPE '\\' OR location LIKE :search ESCAPE '\\')");
    // Escape backslash, % and _ so a search for "100%" is literal (see ESCAPE '\' above).
    params.search = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
  }
  const sql = `SELECT * FROM jobs ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY updated_at DESC, id DESC`;
  return (db.prepare(sql).all(params) as JobRow[]).map(toJob);
}

export function getJob(db: DatabaseSync, id: number): Job | undefined {
  const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as JobRow | undefined;
  return row ? toJob(row) : undefined;
}

export function createJob(db: DatabaseSync, input: JobInput, now = new Date()): Job {
  const timestamp = now.toISOString();
  const result = db
    .prepare(
      `INSERT INTO jobs (company, role, status, location, url, salary_min, salary_max, applied_on, notes, created_at, updated_at)
       VALUES (:company, :role, :status, :location, :url, :salary_min, :salary_max, :applied_on, :notes, :now, :now)`,
    )
    .run({ ...toParams(input), now: timestamp });
  return getJob(db, Number(result.lastInsertRowid))!;
}

export function updateJob(db: DatabaseSync, id: number, input: JobInput, now = new Date()): Job | undefined {
  const result = db
    .prepare(
      `UPDATE jobs SET company = :company, role = :role, status = :status, location = :location, url = :url,
         salary_min = :salary_min, salary_max = :salary_max, applied_on = :applied_on, notes = :notes, updated_at = :now
       WHERE id = :id`,
    )
    .run({ ...toParams(input), now: now.toISOString(), id });
  return result.changes ? getJob(db, id) : undefined;
}

export function deleteJob(db: DatabaseSync, id: number): boolean {
  return db.prepare("DELETE FROM jobs WHERE id = ?").run(id).changes > 0;
}

// Counts per status in one GROUP BY; statuses with no rows still show as 0.
export function jobStats(db: DatabaseSync): JobStats {
  const rows = db.prepare("SELECT status, COUNT(*) AS n FROM jobs GROUP BY status").all() as { status: Status; n: number }[];
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const row of rows) byStatus[row.status] = row.n;

  const total = STATUSES.reduce((sum, s) => sum + byStatus[s], 0);
  const submitted = total - byStatus.wishlist;
  const responded = byStatus.interview + byStatus.offer + byStatus.rejected;
  return {
    total,
    byStatus,
    responseRatePct: submitted === 0 ? 0 : Math.round((100 * responded) / submitted),
  };
}

/** Parses a route or query id; anything but a positive integer is "not found".
 *  Ten digits at most keeps the value well inside Number's safe integer range. */
export function parseId(value: string): number | undefined {
  return /^[1-9]\d{0,9}$/.test(value) ? Number(value) : undefined;
}
