import {
  BarChart3,
  Boxes,
  Handshake,
  Megaphone,
  Settings,
  ShoppingBag,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/catalog", label: "Catalog", icon: Boxes },
  { href: "/admin/crm/leads", label: "Leads", icon: UsersRound },
  { href: "/admin/dealers", label: "Dealers", icon: Handshake },
  { href: "/admin/sales", label: "Sales", icon: ShoppingBag },
  { href: "/admin/marketing/notifications", label: "Marketing", icon: Megaphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminPageShell({
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/">View public catalogue</Link>
            </Button>
          </div>
          <nav className="mt-5 flex gap-2 overflow-x-auto" aria-label="Admin">
            {adminNav.map((item) => (
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
