import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          Page not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          The page or product you requested is not available.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Return to catalogue</Link>
        </Button>
      </div>
    </main>
  );
}
