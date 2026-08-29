import {
  BarChart3,
  Gauge,
  Heart,
  LayoutDashboard,
  Menu,
  Monitor,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getShopSettings } from "@/features/shop/settings";

const navItems = [
  { href: "/", label: "Catalogue" },
  { href: "/offers", label: "Offers" },
  { href: "/compare", label: "Compare" },
  { href: "/dealer", label: "Dealer" },
  { href: "/admin", label: "Admin" },
];

export async function SiteHeader() {
  const shopSettings = await getShopSettings();

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="container-shell flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <Monitor className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-950 sm:text-base">
              {shopSettings.businessName}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:block">
              Catalogue, referrals, leads
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {navItems.map((item) => (
            <Button asChild key={item.href} variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:flex">
            <Link href="/account">
              <UserRound className="size-4" aria-hidden="true" />
              Account
            </Link>
          </Button>
          <Button asChild variant="default" size="sm">
            <Link href="/enquiry">
              <Heart className="size-4" aria-hidden="true" />
              Best price
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="size-5" aria-hidden="true" />
            <span className="sr-only">Open navigation</span>
          </Button>
        </div>
      </div>
      <div className="border-t bg-slate-50 md:hidden">
        <div className="container-shell flex gap-1 overflow-x-auto py-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <Gauge className="size-4" aria-hidden="true" />
              Shop
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/compare">Compare</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dealer">Dealer</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Admin
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">
              <BarChart3 className="size-4" aria-hidden="true" />
              Stats
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const shopSettings = await getShopSettings();

  return (
    <footer className="border-t bg-white">
      <div className="container-shell grid gap-6 py-8 text-sm text-muted-foreground md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-semibold text-slate-900">
            {shopSettings.businessName}
          </p>
          <p className="mt-2 max-w-xl">{shopSettings.footerText}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">Contact</p>
          <p className="mt-2">{shopSettings.phone}</p>
          <p>{shopSettings.email}</p>
          <p className="mt-1">{shopSettings.address}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">White label</p>
          <p className="mt-2">
            Copy this project per client with an independent Supabase and Vercel
            deployment.
          </p>
        </div>
      </div>
    </footer>
  );
}
