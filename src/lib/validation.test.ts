import { describe, expect, it } from "vitest";
import { validateJob } from "./validation";

const valid = { company: "Acme", role: "Frontend Engineer", status: "applied" };

describe("validateJob", () => {
  it("accepts a minimal job and fills defaults", () => {
    const result = validateJob(valid);
    expect(result).toEqual({
      success: true,
      data: { ...valid, location: "", url: "", appliedOn: "", notes: "", salaryMin: undefined, salaryMax: undefined },
    });
  });

  it("treats empty form fields as not set and converts numbers", () => {
    const result = validateJob({ ...valid, salaryMin: "", salaryMax: "90000" });
    expect(result.success && result.data.salaryMin).toBeUndefined();
    expect(result.success && result.data.salaryMax).toBe(90000);
  });

  it.each([
    [{ ...valid, company: "  " }, "company"],
    [{ ...valid, status: "ghosted" }, "status"],
    [{ ...valid, salaryMin: "abc" }, "salaryMin"],
    [{ ...valid, salaryMin: "-5" }, "salaryMin"],
    [{ ...valid, salaryMin: "90000", salaryMax: "80000" }, "salaryMax"],
    [{ ...valid, appliedOn: "2026-02-30" }, "appliedOn"],
    [{ ...valid, url: "acme.com/jobs" }, "url"],
  ])("rejects %j on %s", (input, field) => {
    const result = validateJob(input);
    expect(result.success).toBe(false);
    expect(result.success ? {} : result.errors).toHaveProperty(field);
  });

  it("rejects javascript: links (stored XSS)", () => {
    const result = validateJob({ ...valid, url: "javascript:alert(document.cookie)" });
    expect(result.success).toBe(false);
  });

  it("rejects non-object input", () => {
    expect(validateJob(null).success).toBe(false);
    expect(validateJob("job").success).toBe(false);
  });
});
