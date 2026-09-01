export type FeatureFlag =
  | "customerAccounts"
  | "dealerPortal"
  | "comparison"
  | "offers"
  | "customerNotifications"
  | "automatedWhatsApp"
  | "commission"
  | "quotationRequests"
  | "advancedAnalytics";

export const defaultFeatureFlags: Record<FeatureFlag, boolean> = {
  customerAccounts: true,
  dealerPortal: true,
  comparison: true,
  offers: true,
  customerNotifications: true,
  automatedWhatsApp: false,
  commission: true,
  quotationRequests: true,
  advancedAnalytics: true,
};

export const defaultShopSettings = {
  businessName: process.env.SHOP_DEFAULT_NAME ?? "Computer House",
  shortName: process.env.SHOP_DEFAULT_SHORT_NAME ?? "Computer House",
  phone: process.env.SHOP_DEFAULT_PHONE ?? "+91 70208 57227",
  whatsappNumber: process.env.WHATSAPP_PHONE_NUMBER ?? "917391868111",
  email: process.env.SHOP_DEFAULT_EMAIL ?? "computerhouseisl@gmail.com",
  address:
    process.env.SHOP_DEFAULT_ADDRESS ??
    "2nd floor, Kamalkunj, near Sai Speciality Hospital, Shirala Naka, Islampur, Maharashtra, India",
  currency: process.env.SHOP_DEFAULT_CURRENCY ?? "INR",
  timezone: process.env.SHOP_DEFAULT_TIMEZONE ?? "Asia/Kolkata",
  primaryColor: process.env.SHOP_PRIMARY_COLOR ?? "#f80050",
  secondaryColor: process.env.SHOP_SECONDARY_COLOR ?? "#900030",
  defaultAttributionDays: Number(
    process.env.SHOP_DEFAULT_ATTRIBUTION_DAYS ?? 30,
  ),
  socialLinks: {
    instagram: "",
    facebook: "",
    youtube: "",
  },
  footerText:
    "Computer House helps customers choose the right laptop, desktop, printer, monitor, accessory, or refurbished system with local guidance and quick follow-up.",
};
