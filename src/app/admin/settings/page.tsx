import { AdminPageShell } from "@/components/admin/admin-page-shell";
import { FormSection } from "@/components/admin/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateShopSettings } from "@/features/admin/actions";
import { getShopSettings } from "@/features/shop/settings";
import { requireRole } from "@/lib/auth";

export default async function AdminSettingsPage() {
  await requireRole(["OWNER", "ADMIN"]);
  const shopSettings = await getShopSettings();

  return (
    <AdminPageShell
      title="Shop settings"
      description="Manage business identity, contact details, brand colors, currency, timezone, and referral attribution duration."
    >
      <FormSection title="Business settings">
        <form action={updateShopSettings} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                name="businessName"
                defaultValue={shopSettings.businessName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shortName">Short name</Label>
              <Input
                id="shortName"
                name="shortName"
                defaultValue={shopSettings.shortName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={shopSettings.phone}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="whatsappNumber">WhatsApp number</Label>
              <Input
                id="whatsappNumber"
                name="whatsappNumber"
                defaultValue={shopSettings.whatsappNumber}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={shopSettings.email}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue={shopSettings.currency}
                maxLength={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={shopSettings.timezone}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="defaultAttributionDays">Attribution days</Label>
              <Input
                id="defaultAttributionDays"
                name="defaultAttributionDays"
                type="number"
                defaultValue={shopSettings.defaultAttributionDays}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="primaryColor">Primary color</Label>
              <Input
                id="primaryColor"
                name="primaryColor"
                type="color"
                defaultValue={shopSettings.primaryColor}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="secondaryColor">Secondary color</Label>
              <Input
                id="secondaryColor"
                name="secondaryColor"
                type="color"
                defaultValue={shopSettings.secondaryColor}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              defaultValue={shopSettings.address}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="footerText">Footer text</Label>
            <Textarea
              id="footerText"
              name="footerText"
              defaultValue={shopSettings.footerText}
            />
          </div>
          <Button type="submit">Save settings</Button>
        </form>
      </FormSection>
    </AdminPageShell>
  );
}
