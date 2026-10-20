import { CalendarRange, Pencil } from "lucide-react";
import Link from "next/link";

import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FormSection } from "@/components/admin/form-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, Td, Th } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { listAdminProducts } from "@/features/admin/data";
import { createOffer } from "@/features/offers/actions";
import { listAdminOffers } from "@/features/offers/data";
import { requireRole } from "@/lib/auth";

function defaultDateTime(daysFromNow: number) {
  const value = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  return value.toISOString().slice(0, 16);
}

function offerState(offer: { active: boolean; startsAt: Date; endsAt: Date }) {
  const now = new Date();
  if (!offer.active) return "Inactive";
  if (offer.startsAt > now) return "Scheduled";
  if (offer.endsAt < now) return "Ended";
  return "Live";
}

export default async function AdminOffersPage() {
  await requireRole(["OWNER", "ADMIN", "STAFF"]);
  const [products, offers] = await Promise.all([
    listAdminProducts(),
    listAdminOffers(),
  ]);

  return (
    <AdminPageShell
      title="Offers"
      description="Create time-bound promotions without changing the product's regular or selling price."
    >
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <FormSection title="Create offer">
          <form action={createOffer} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Offer title</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bannerText">Catalogue badge text</Label>
              <Input id="bannerText" name="bannerText" placeholder="Festival price" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="offerType">Offer type</Label>
                <Select id="offerType" name="offerType" defaultValue="PERCENTAGE">
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED_AMOUNT">Fixed amount</option>
                  <option value="BUNDLE">Bundle</option>
                  <option value="CUSTOM">Custom</option>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="discountValue">Discount/value</Label>
                <Input id="discountValue" name="discountValue" type="number" min="0" step="0.01" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="startsAt">Starts</Label>
                <Input id="startsAt" name="startsAt" type="datetime-local" defaultValue={defaultDateTime(0)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endsAt">Ends</Label>
                <Input id="endsAt" name="endsAt" type="datetime-local" defaultValue={defaultDateTime(30)} required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="productIds">Products</Label>
              <Select id="productIds" name="productIds" multiple className="h-44" required>
                {products.filter((product) => product.published).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">Use Ctrl or Command to select multiple products.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <input name="active" type="checkbox" defaultChecked />
              Active
            </label>
            <Button type="submit" disabled={products.length === 0}>
              <CalendarRange className="size-4" aria-hidden="true" />
              Create offer
            </Button>
          </form>
        </FormSection>

        <FormSection title="Offer schedule">
          <Table>
            <thead>
              <tr>
                <Th>Offer</Th>
                <Th>Products</Th>
                <Th>Schedule</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {offers.length > 0 ? (
                offers.map((offer) => (
                  <tr key={offer.id}>
                    <Td className="font-medium text-slate-950">
                      {offer.title}
                      <p className="text-xs text-muted-foreground">{offer.offerType.replaceAll("_", " ")}</p>
                    </Td>
                    <Td>{offer.products.map((product) => product.name).join(", ") || "No products"}</Td>
                    <Td>
                      {offer.startsAt.toLocaleDateString("en-IN")} - {offer.endsAt.toLocaleDateString("en-IN")}
                    </Td>
                    <Td><Badge variant={offerState(offer) === "Live" ? "default" : "outline"}>{offerState(offer)}</Badge></Td>
                    <Td>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/catalog/offers/${offer.id}`}>
                          <Pencil className="size-4" aria-hidden="true" />
                          Edit
                        </Link>
                      </Button>
                    </Td>
                  </tr>
                ))
              ) : (
                <tr><Td colSpan={5}>No offers created yet.</Td></tr>
              )}
            </tbody>
          </Table>
        </FormSection>
      </div>
    </AdminPageShell>
  );
}
