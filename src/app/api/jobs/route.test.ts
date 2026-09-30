import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { DELETE, GET as getOne, PUT } from "./[id]/route";
import { GET as list, POST } from "./route";

// Route handlers are plain functions: call them with real Request objects.

const BASE = "http://localhost/api/jobs";
const job = { company: "Acme", role: "Engineer", status: "applied" };

const json = (method: string, body: unknown, url = BASE) =>
  new NextRequest(url, { method, body: JSON.stringify(body), headers: { "content-type": "application/json" } });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  // Fresh in-memory database per test (getDb caches the connection on globalThis).
  delete (globalThis as { jobsDb?: unknown }).jobsDb;
});

describe("/api/jobs", () => {
  it("creates a job: 201 with Location", async () => {
    const response = await POST(json("POST", job));
    expect(response.status).toBe(201);
    const { job: created } = await response.json();
    expect(response.headers.get("location")).toBe(`/api/jobs/${created.id}`);
  });

  it("returns 422 with field errors for invalid input", async () => {
    const response = await POST(json("POST", { ...job, status: "ghosted", company: "" }));
    expect(response.status).toBe(422);
    expect(Object.keys((await response.json()).errors).sort()).toEqual(["company", "status"]);
  });

  it("returns 400 for a body that is not a JSON object", async () => {
    const response = await POST(new NextRequest(BASE, { method: "POST", body: "not json" }));
    expect(response.status).toBe(400);
  });

  it("lists and filters, rejecting unknown statuses", async () => {
    await POST(json("POST", job));
    await POST(json("POST", { ...job, company: "Globex", status: "offer" }));

    const all = await (await list(new NextRequest(BASE))).json();
    expect(all.jobs).toHaveLength(2);
    const offers = await (await list(new NextRequest(`${BASE}?status=offer`))).json();
    expect(offers.jobs.map((j: { company: string }) => j.company)).toEqual(["Globex"]);
    expect((await list(new NextRequest(`${BASE}?status=ghosted`))).status).toBe(400);
  });
});

describe("/api/jobs/[id]", () => {
  it("reads, replaces and deletes a job", async () => {
    const { job: created } = await (await POST(json("POST", job))).json();
    const id = String(created.id);

    expect((await getOne(new NextRequest(`${BASE}/${id}`), ctx(id))).status).toBe(200);

    const updated = await PUT(json("PUT", { ...job, status: "interview" }, `${BASE}/${id}`), ctx(id));
    expect((await updated.json()).job.status).toBe("interview");

    expect((await DELETE(new NextRequest(`${BASE}/${id}`, { method: "DELETE" }), ctx(id))).status).toBe(204);
    expect((await getOne(new NextRequest(`${BASE}/${id}`), ctx(id))).status).toBe(404);
  });

  it("404s for ids that are missing or malformed", async () => {
    for (const id of ["999", "abc", "-1"]) {
      expect((await getOne(new NextRequest(`${BASE}/${id}`), ctx(id))).status).toBe(404);
    }
  });
});
