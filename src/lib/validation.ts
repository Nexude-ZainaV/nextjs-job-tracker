import { z } from "zod";

export const STATUSES = ["wishlist", "applied", "interview", "offer", "rejected"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  wishlist: "Wishlist",
  applied: "Applied",
  interview: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

const MAX_SALARY = 10_000_000;

/** Empty form fields arrive as "", which should mean "not set", not 0. */
const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
  z
    .number({ error: "Enter a whole number." })
    .int("Enter a whole number.")
    .min(0, "Must be 0 or more.")
    .max(MAX_SALARY, "That number is too large.")
    .optional(),
);

/**
 * Only http(s) links are allowed: a "javascript:" URL stored here would run
 * when someone clicks the link on the job page (stored XSS).
 */
function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export const jobInputSchema = z
  .object({
    company: z.string().trim().min(1, "Company is required.").max(100),
    role: z.string().trim().min(1, "Role is required.").max(120),
    status: z.enum(STATUSES, { error: "Pick a status." }),
    location: z.string().trim().max(100).default(""),
    url: z
      .string()
      .trim()
      .max(500)
      .default("")
      .refine((value) => value === "" || isHttpUrl(value), "Enter a full link starting with https://"),
    salaryMin: optionalNumber,
    salaryMax: optionalNumber,
    appliedOn: z
      .string()
      .trim()
      .default("")
      .refine((value) => value === "" || (/^\d{4}-\d{2}-\d{2}$/.test(value) && isRealDate(value)), "Enter a valid date."),
    notes: z.string().trim().max(5000).default(""),
  })
  .refine((job) => job.salaryMin === undefined || job.salaryMax === undefined || job.salaryMax >= job.salaryMin, {
    message: "Maximum must be at least the minimum.",
    path: ["salaryMax"],
  });

export type JobInput = z.infer<typeof jobInputSchema>;
export type FieldErrors = Partial<Record<keyof JobInput, string>>;

export type ValidationResult = { success: true; data: JobInput } | { success: false; errors: FieldErrors };

/** Validates untrusted input (FormData entries or a JSON body) into a JobInput. */
export function validateJob(input: unknown): ValidationResult {
  const result = jobInputSchema.safeParse(input);
  if (result.success) return { success: true, data: result.data };

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof JobInput | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { success: false, errors };
}

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}
