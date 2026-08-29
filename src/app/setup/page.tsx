import { UserRoundPlus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBootstrapOwner } from "@/features/auth/actions";
import { canBootstrapOwner, hasOwnerProfile } from "@/features/auth/bootstrap";

function pick(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = pick(params.error);
  const configured = canBootstrapOwner();
  const ownerExists = await hasOwnerProfile();

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="grid size-10 place-items-center rounded-md bg-primary text-primary-foreground">
            <UserRoundPlus className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="mt-4 text-2xl">First owner setup</CardTitle>
          <p className="text-sm text-muted-foreground">
            Create the first protected owner profile for this shop deployment.
          </p>
        </CardHeader>
        <CardContent>
          {!configured ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Supabase and database environment variables are required before
              setup can run.
            </p>
          ) : ownerExists ? (
            <div className="grid gap-3">
              <p className="rounded-md border bg-slate-50 p-3 text-sm text-muted-foreground">
                An owner profile already exists. Use the regular sign-in page.
              </p>
              <Button asChild>
                <Link href="/login">Go to sign in</Link>
              </Button>
            </div>
          ) : (
            <form action={createBootstrapOwner} className="grid gap-4">
              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error === "email-not-allowed"
                    ? "Use the configured bootstrap owner email."
                    : "Owner setup could not be completed. Check Supabase Auth settings and try again."}
                </p>
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Owner email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={process.env.BOOTSTRAP_OWNER_EMAIL ?? ""}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button type="submit">Create owner</Button>
            </form>
          )}
          <Button asChild className="mt-3 w-full" variant="ghost">
            <Link href="/">Back to catalogue</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
