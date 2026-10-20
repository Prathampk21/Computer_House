import { ArrowLeft, Ban, Power } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FormSection } from "@/components/admin/form-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { listAdminProducts } from "@/features/admin/data";
import { setOfferActive, updateOffer } from "@/features/offers/actions";
import { getAdminOfferById } from "@/features/offers/data";
import { requireRole } from "@/lib/auth";

function dateTimeValue(value: Date) {
  return value.toISOString().slice(0, 16);
}

function pick(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminOfferPage({
  params,
  searchParams,
}: {
  params: Promise<{ offerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const [{ offerId }, query] = await Promise.all([params, searchParams]);
  const [offer, products] = await Promise.all([
    getAdminOfferById(offerId),
    listAdminProducts(),
  ]);

  if (!offer) notFound();

  const selectedIds = new Set(offer.products.map((product) => product.id));
  const canDeactivate = profile.role === "OWNER" || profile.role === "ADMIN";

  return (
    <AdminPageShell title={offer.title} description="Edit promotion details, assigned products, dates, and catalogue visibility.">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/catalog/offers"><ArrowLeft className="size-4" aria-hidden="true" />Offers</Link>
        </Button>
        <Badge variant={offer.active ? "default" : "outline"}>{offer.active ? "Active" : "Inactive"}</Badge>
      </div>
      {pick(query.created) || pick(query.saved) ? (
        <p className="mb-5 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {pick(query.created) ? "Offer created." : "Offer changes saved."}
        </p>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <FormSection title="Offer details">
          <form action={updateOffer} className="grid gap-4">
            <input type="hidden" name="offerId" value={offer.id} />
            <div className="grid gap-2"><Label htmlFor="title">Title</Label><Input id="title" name="title" defaultValue={offer.title} required /></div>
            <div className="grid gap-2"><Label htmlFor="bannerText">Catalogue badge text</Label><Input id="bannerText" name="bannerText" defaultValue={offer.bannerText ?? ""} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2"><Label htmlFor="offerType">Offer type</Label><Select id="offerType" name="offerType" defaultValue={offer.offerType}><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed amount</option><option value="BUNDLE">Bundle</option><option value="CUSTOM">Custom</option></Select></div>
              <div className="grid gap-2"><Label htmlFor="discountValue">Discount/value</Label><Input id="discountValue" name="discountValue" type="number" min="0" step="0.01" defaultValue={offer.discountValue ?? ""} /></div>
              <div className="grid gap-2"><Label htmlFor="startsAt">Starts</Label><Input id="startsAt" name="startsAt" type="datetime-local" defaultValue={dateTimeValue(offer.startsAt)} required /></div>
              <div className="grid gap-2"><Label htmlFor="endsAt">Ends</Label><Input id="endsAt" name="endsAt" type="datetime-local" defaultValue={dateTimeValue(offer.endsAt)} required /></div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="productIds">Products</Label>
              <Select id="productIds" name="productIds" multiple className="h-56" required defaultValue={[...selectedIds]}>
                {products.filter((product) => product.published || selectedIds.has(product.id)).map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}
              </Select>
            </div>
            <div className="grid gap-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" defaultValue={offer.description ?? ""} /></div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800"><input name="active" type="checkbox" defaultChecked={offer.active} />Active</label>
            <Button type="submit">Save offer</Button>
          </form>
        </FormSection>
        {canDeactivate ? (
          <FormSection title="Offer availability">
            <p className="mb-4 text-sm text-muted-foreground">Deactivating removes this offer from public catalogue pricing badges while preserving its history.</p>
            <form action={setOfferActive}>
              <input type="hidden" name="offerId" value={offer.id} />
              <input type="hidden" name="active" value={offer.active ? "false" : "true"} />
              <Button type="submit" variant={offer.active ? "destructive" : "default"}>
                {offer.active ? <Ban className="size-4" aria-hidden="true" /> : <Power className="size-4" aria-hidden="true" />}
                {offer.active ? "Deactivate offer" : "Activate offer"}
              </Button>
            </form>
          </FormSection>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
