import { BarChart3, HandCoins, Link2, ListChecks } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

const dealerNav = [
  { href: "/dealer", label: "Dashboard", icon: BarChart3 },
  { href: "/dealer/leads", label: "Leads", icon: ListChecks },
  { href: "/dealer/commissions", label: "Commissions", icon: HandCoins },
];

export function DealerPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="container-shell py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-3">
              <BrandLogo className="mt-0.5" size="lg" />
              <div>
                <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/">
                <Link2 className="size-4" aria-hidden="true" />
                Catalogue
              </Link>
            </Button>
          </div>
          <nav className="mt-5 flex gap-2 overflow-x-auto" aria-label="Dealer">
            {dealerNav.map((item) => (
              <Button asChild key={item.href} variant="ghost" size="sm">
                <Link href={item.href}>
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </div>
      </div>
      <div className="container-shell py-6">{children}</div>
    </main>
  );
}
