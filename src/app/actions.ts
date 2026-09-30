"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { createJob, deleteJob, updateJob } from "@/lib/jobs";
import { validateJob, type FieldErrors } from "@/lib/validation";

export interface FormState {
  errors: FieldErrors;
  message?: string;
  /** What the user typed, so a failed submit doesn't wipe the form. */
  values?: Record<string, string>;
}

function formValues(formData: FormData): Record<string, string> {
  return Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
}

// Server Functions are reachable by direct POST, so each one validates its own input.

export async function createJobAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const result = validateJob(values);
  if (!result.success) return { errors: result.errors, message: "Check the highlighted fields.", values };

  const job = createJob(getDb(), result.data);
  revalidatePath("/");
  redirect(`/jobs/${job.id}?saved=1`); // throws: nothing after this runs
}

export async function updateJobAction(id: number, _previous: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const result = validateJob(values);
  if (!result.success) return { errors: result.errors, message: "Check the highlighted fields.", values };

  const job = updateJob(getDb(), id, result.data);
  if (!job) return { errors: {}, message: "This application no longer exists." };
  revalidatePath("/");
  revalidatePath(`/jobs/${id}`);
  return { errors: {}, message: "Saved." };
}

export async function deleteJobAction(id: number): Promise<void> {
  deleteJob(getDb(), id);
  revalidatePath("/");
  redirect("/");
}
