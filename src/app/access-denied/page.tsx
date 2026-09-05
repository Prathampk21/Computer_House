import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-destructive">
          Access denied
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          You do not have permission
        </h1>
        <p className="mt-3 text-muted-foreground">
          This account does not have access to that workspace. Please sign in
          with an admin or dealer account.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/">Return to catalogue</Link>
        </Button>
      </div>
    </main>
  );
}
