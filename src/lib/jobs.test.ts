// Repository tests against a fresh in-memory SQLite database. Run: npm test

import type { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "./db";
import { createJob, deleteJob, getJob, jobStats, listJobs, parseId, updateJob } from "./jobs";
import type { JobInput } from "./validation";

// A valid JobInput; tests override only the fields they care about.
const input = (overrides: Partial<JobInput> = {}): JobInput => ({
  company: "Acme",
  role: "Engineer",
  status: "applied",
  location: "",
  url: "",
  appliedOn: "",
  notes: "",
  ...overrides,
});

let db: DatabaseSync;
beforeEach(() => {
  db = openDatabase(":memory:");
});

describe("jobs repository", () => {
  it("creates and reads back a job, mapping empty values", () => {
    const job = createJob(db, input({ salaryMin: 50000, appliedOn: "2026-09-01" }));
    expect(getJob(db, job.id)).toEqual(job);
    expect(job.salaryMax).toBeUndefined();
    expect(job.appliedOn).toBe("2026-09-01");
  });

  it("lists most recently updated first", () => {
    const first = createJob(db, input({ company: "First" }), new Date("2026-09-01"));
    createJob(db, input({ company: "Second" }), new Date("2026-09-02"));
    updateJob(db, first.id, input({ company: "First" }), new Date("2026-09-03"));
    expect(listJobs(db).map((j) => j.company)).toEqual(["First", "Second"]);
  });

  it("filters by status and searches company, role and location", () => {
    createJob(db, input({ company: "Acme", status: "interview" }));
    createJob(db, input({ company: "Globex", role: "Data Analyst", location: "Remote" }));
    expect(listJobs(db, { status: "interview" }).map((j) => j.company)).toEqual(["Acme"]);
    expect(listJobs(db, { search: "remote" }).map((j) => j.company)).toEqual(["Globex"]);
    expect(listJobs(db, { search: "analyst" })).toHaveLength(1);
  });

  it("treats LIKE wildcards in the search as plain text", () => {
    createJob(db, input({ company: "100% Remote Co" }));
    createJob(db, input({ company: "1000 Labs" }));
    expect(listJobs(db, { search: "100%" }).map((j) => j.company)).toEqual(["100% Remote Co"]);
  });

  it("updates and deletes, reporting missing ids", () => {
    const job = createJob(db, input());
    expect(updateJob(db, job.id, input({ status: "offer" }))?.status).toBe("offer");
    expect(updateJob(db, 999, input())).toBeUndefined();
    expect(deleteJob(db, job.id)).toBe(true);
    expect(deleteJob(db, job.id)).toBe(false);
  });

  it("computes stats and the response rate (wishlist excluded)", () => {
    for (const status of ["wishlist", "applied", "applied", "interview", "rejected"] as const) {
      createJob(db, input({ status }));
    }
    const stats = jobStats(db);
    expect(stats.total).toBe(5);
    expect(stats.byStatus).toEqual({ wishlist: 1, applied: 2, interview: 1, offer: 0, rejected: 1 });
    expect(stats.responseRatePct).toBe(50); // 2 of 4 submitted got a response
  });

  it("returns a 0% response rate when nothing was submitted", () => {
    expect(jobStats(db).responseRatePct).toBe(0);
  });
});

describe("parseId", () => {
  it("accepts positive integers only", () => {
    expect(parseId("42")).toBe(42);
    for (const bad of ["0", "-1", "1.5", "abc", "1e3", "", "12345678901"]) {
      expect(parseId(bad)).toBeUndefined();
    }
  });
});
