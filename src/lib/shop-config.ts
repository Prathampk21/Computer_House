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
  whatsappNumber: process.env.WHATSAPP_PHONE_NUMBER ?? "919876543210",
  email: process.env.SHOP_DEFAULT_EMAIL ?? "computerhouseisl@gmail.com",
  address:
    process.env.SHOP_DEFAULT_ADDRESS ??
    "2nd floor, Kamalkunj, near Sai Speciality Hospital, Shirala Naka, Islampur, Maharashtra, India",
  currency: process.env.SHOP_DEFAULT_CURRENCY ?? "INR",
  timezone: process.env.SHOP_DEFAULT_TIMEZONE ?? "Asia/Kolkata",
  primaryColor: process.env.SHOP_PRIMARY_COLOR ?? "#0f766e",
  secondaryColor: process.env.SHOP_SECONDARY_COLOR ?? "#f59e0b",
  defaultAttributionDays: Number(
    process.env.SHOP_DEFAULT_ATTRIBUTION_DAYS ?? 30,
  ),
  socialLinks: {
    instagram: "",
    facebook: "",
    youtube: "",
  },
  footerText:
    "Independent white-label catalogue, dealer referral, and lead-management template.",
};
