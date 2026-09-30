import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid justify-items-start gap-3">
      <h2 className="text-xl font-semibold">Not found</h2>
      <p className="text-slate-600 dark:text-slate-400">That application doesn&apos;t exist, or it was deleted.</p>
      <Link href="/" className="font-medium text-indigo-600 underline">
        Back to all applications
      </Link>
    </div>
  );
}
