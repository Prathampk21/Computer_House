import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/features/auth/actions";

function pick(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = pick(params.error);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <BrandLogo size="lg" priority />
          <CardTitle className="mt-4 text-2xl">Reset password</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter the email used for your Computer House account.
          </p>
        </CardHeader>
        <CardContent>
          {pick(params.sent) ? (
            <p className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Check your email for a secure password reset link.
            </p>
          ) : null}
          {error ? (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error === "expired-link"
                ? "That reset link is invalid or expired. Request a new one."
                : error === "missing-supabase"
                  ? "Password recovery is not configured."
                  : "Unable to send the reset email. Please try again."}
            </p>
          ) : null}
          <form action={requestPasswordReset} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <Button type="submit">Send reset link</Button>
          </form>
          <Button asChild className="mt-3 w-full" variant="ghost">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
