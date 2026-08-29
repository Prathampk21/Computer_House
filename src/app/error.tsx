"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-destructive">
          Something went wrong
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          The app hit an error
        </h1>
        <p className="mt-3 text-muted-foreground">
          Try again, or check server logs for the failed request.
        </p>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </main>
  );
}
