import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "@/features/auth/actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <BrandLogo size="lg" priority />
          <CardTitle className="mt-4 text-2xl">Choose a new password</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use at least 10 characters and keep this password private.
          </p>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              The password could not be updated. Request a new reset link and try again.
            </p>
          ) : null}
          <form action={updatePassword} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" minLength={10} autoComplete="new-password" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" minLength={10} autoComplete="new-password" required />
            </div>
            <Button type="submit">Update password</Button>
          </form>
          <Button asChild className="mt-3 w-full" variant="ghost">
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
