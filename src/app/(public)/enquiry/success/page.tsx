import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function pick(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EnquirySuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const reference = pick(params.ref);

  return (
    <div className="container-shell grid min-h-[70vh] place-items-center py-10">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <Badge>Enquiry received</Badge>
          <CardTitle className="mt-3 text-2xl">Thank you</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Your enquiry has been sent to Computer House. Our team will review
            the product details and contact you shortly.
          </p>
          {reference ? (
            <div className="rounded-md border bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Enquiry reference
              </p>
              <p className="mt-1 font-semibold text-slate-950">{reference}</p>
            </div>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/">Back to catalogue</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/compare">Compare products</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
