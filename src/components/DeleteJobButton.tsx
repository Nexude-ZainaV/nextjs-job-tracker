"use client";

// A client component only for the confirm() prompt; the delete itself is a Server Action.

import { deleteJobAction } from "@/app/actions";

export function DeleteJobButton({ id, label }: { id: number; label: string }) {
  return (
    <form
      action={deleteJobAction.bind(null, id)}
      onSubmit={(event) => {
        if (!confirm(`Delete the application for ${label}?`)) event.preventDefault();
      }}
    >
      <button type="submit" className="rounded-lg border border-rose-300 px-4 py-2 font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950">
        Delete
      </button>
    </form>
  );
}
