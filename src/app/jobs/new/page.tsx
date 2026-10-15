// Page with an empty form for adding an application.

import type { Metadata } from "next";
import { createJobAction } from "@/app/actions";
import { JobForm } from "@/components/JobForm";

export const metadata: Metadata = { title: "New application" };

export default function NewJobPage() {
  return (
    <div className="grid max-w-3xl gap-6">
      <h2 className="text-xl font-semibold">New application</h2>
      <JobForm action={createJobAction} submitLabel="Add application" />
    </div>
  );
}
