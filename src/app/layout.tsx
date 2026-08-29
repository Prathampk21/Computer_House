import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getShopSettings } from "@/features/shop/settings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const shopSettings = await getShopSettings();

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    title: {
      default: shopSettings.businessName,
      template: `%s | ${shopSettings.businessName}`,
    },
    description:
      "Computer House catalogue, dealer referral, lead management, and commission portal.",
    openGraph: {
      title: shopSettings.businessName,
      description:
        "Browse laptops, desktops, printers, monitors, accessories, and offers.",
      type: "website",
      url: "/",
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
