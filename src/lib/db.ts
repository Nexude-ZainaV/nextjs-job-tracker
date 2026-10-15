// SQLite connection (node:sqlite) and the jobs table schema. Server only.
import "server-only";

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

const DEFAULT_DB_PATH = "data/jobs.db";

// The CHECK repeats STATUSES so the database itself rejects an unknown status.
// The index serves the dashboard's "filter by status, newest first" list.
export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS jobs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    company     TEXT    NOT NULL,
    role        TEXT    NOT NULL,
    status      TEXT    NOT NULL CHECK (status IN ('wishlist', 'applied', 'interview', 'offer', 'rejected')),
    location    TEXT    NOT NULL DEFAULT '',
    url         TEXT    NOT NULL DEFAULT '',
    salary_min  INTEGER,
    salary_max  INTEGER,
    applied_on  TEXT,
    notes       TEXT    NOT NULL DEFAULT '',
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL
  );
  CREATE INDEX IF NOT EXISTS ix_jobs_status ON jobs (status, updated_at);
`;

// Opens a file database (creating its folder) or ":memory:" for tests, and applies the schema.
export function openDatabase(path: string): DatabaseSync {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL"); // readers don't block the writer
  db.exec(SCHEMA);
  return db;
}

// Dev-mode hot reload re-evaluates modules; caching on globalThis keeps one connection.
const globalForDb = globalThis as unknown as { jobsDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  globalForDb.jobsDb ??= openDatabase(process.env.JOBS_DB_PATH ?? DEFAULT_DB_PATH);
  return globalForDb.jobsDb;
}
