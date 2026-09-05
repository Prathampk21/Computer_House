import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword } from "@/features/auth/actions";
import { hasOwnerProfile } from "@/features/auth/bootstrap";
import { isDemoMode } from "@/lib/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const setup = Array.isArray(params.setup) ? params.setup[0] : params.setup;
  const ownerExists = await hasOwnerProfile();

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <BrandLogo size="lg" priority />
          <CardTitle className="mt-4 text-2xl">
            Sign in to Computer House
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Access the admin or dealer workspace.
          </p>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error === "missing-supabase"
                ? "Supabase environment variables are not configured."
                : "Invalid credentials."}
            </p>
          ) : null}
          {setup ? (
            <p className="mb-4 rounded-md border bg-slate-50 p-3 text-sm text-muted-foreground">
              {setup === "created"
                ? "Owner profile created. Sign in with the password you chose."
                : "Owner profile already exists."}
            </p>
          ) : null}
          <form action={signInWithPassword} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required={!isDemoMode}
                defaultValue={isDemoMode ? "owner@example.com" : ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required={!isDemoMode}
                defaultValue={isDemoMode ? "demo-password" : ""}
              />
            </div>
            <Button type="submit">Continue</Button>
          </form>
          {!ownerExists ? (
            <Button asChild className="mt-3 w-full" variant="outline">
              <Link href="/setup">Create first owner</Link>
            </Button>
          ) : null}
          <Button asChild className="mt-3 w-full" variant="ghost">
            <Link href="/">Back to catalogue</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
