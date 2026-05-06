// src/app/unauthorized/page.tsx

import Link from "next/link";
import { LockKeyhole, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#120A1F] px-4">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
          <LockKeyhole className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          You do not have permission to access this page. Please contact the
          administrator if you think this is a mistake.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2E1065] via-[#7C3AED] to-[#EC4899] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/25"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </section>
    </main>
  );
}
