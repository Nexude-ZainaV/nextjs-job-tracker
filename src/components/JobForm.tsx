"use client";

// The create/edit form, with per-field errors and a pending state on submit.

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions";
import type { Job } from "@/lib/jobs";
import { STATUSES, STATUS_LABELS } from "@/lib/validation";

interface JobFormProps {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  job?: Job;
  submitLabel: string;
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 aria-[invalid=true]:border-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

/**
 * Create and edit form. Works before JavaScript loads (a plain form POST to the
 * Server Action); once hydrated, useActionState shows errors without a reload.
 */
export function JobForm({ action, job, submitLabel }: JobFormProps) {
  const [state, formAction] = useActionState(action, { errors: {} });
  // After a failed submit show what was typed; otherwise the saved job's value.
  const value = (field: string, fallback: string | number | undefined) => state.values?.[field] ?? fallback ?? "";

  return (
    <form action={formAction} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field label="Company" name="company" error={state.errors.company}>
        <input id="company" name="company" required maxLength={100} defaultValue={value("company", job?.company)} className={inputClass} aria-invalid={!!state.errors.company} aria-describedby="company-error" />
      </Field>
      <Field label="Role" name="role" error={state.errors.role}>
        <input id="role" name="role" required maxLength={120} defaultValue={value("role", job?.role)} className={inputClass} aria-invalid={!!state.errors.role} aria-describedby="role-error" />
      </Field>
      <Field label="Status" name="status" error={state.errors.status}>
        <select id="status" name="status" defaultValue={value("status", job?.status ?? "applied")} className={inputClass}>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Location" name="location" error={state.errors.location}>
        <input id="location" name="location" placeholder="Remote, Manila, Toronto…" defaultValue={value("location", job?.location)} className={inputClass} />
      </Field>
      <Field label="Salary min (USD / year)" name="salaryMin" error={state.errors.salaryMin}>
        <input id="salaryMin" name="salaryMin" type="number" min={0} step={1000} inputMode="numeric" defaultValue={value("salaryMin", job?.salaryMin)} className={inputClass} aria-invalid={!!state.errors.salaryMin} aria-describedby="salaryMin-error" />
      </Field>
      <Field label="Salary max (USD / year)" name="salaryMax" error={state.errors.salaryMax}>
        <input id="salaryMax" name="salaryMax" type="number" min={0} step={1000} inputMode="numeric" defaultValue={value("salaryMax", job?.salaryMax)} className={inputClass} aria-invalid={!!state.errors.salaryMax} aria-describedby="salaryMax-error" />
      </Field>
      <Field label="Job posting link" name="url" error={state.errors.url}>
        <input id="url" name="url" type="url" placeholder="https://" defaultValue={value("url", job?.url)} className={inputClass} aria-invalid={!!state.errors.url} aria-describedby="url-error" />
      </Field>
      <Field label="Applied on" name="appliedOn" error={state.errors.appliedOn}>
        <input id="appliedOn" name="appliedOn" type="date" defaultValue={value("appliedOn", job?.appliedOn)} className={inputClass} aria-invalid={!!state.errors.appliedOn} aria-describedby="appliedOn-error" />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Notes" name="notes" error={state.errors.notes}>
          <textarea id="notes" name="notes" rows={5} maxLength={5000} defaultValue={value("notes", job?.notes)} className={inputClass} />
        </Field>
      </div>

      <div className="flex items-center gap-4 sm:col-span-2">
        <SubmitButton label={submitLabel} />
        <p role="status" aria-live="polite" className={Object.keys(state.errors).length ? "text-red-600" : "text-emerald-600"}>
          {state.message}
        </p>
      </div>
    </form>
  );
}

// Label, control and an error line. The error <p> always renders so aria-describedby
// has a target and the layout doesn't jump when a message appears.
function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <label htmlFor={name} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
      <p id={`${name}-error`} className="min-h-5 text-sm text-red-600">
        {error}
      </p>
    </div>
  );
}

// useFormStatus reads the parent form's pending state, so it must be a child component.
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60">
      {pending ? "Saving…" : label}
    </button>
  );
}
