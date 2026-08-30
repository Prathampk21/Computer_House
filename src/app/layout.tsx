import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { CSSProperties } from "react";
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

type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

function normalizeHexColor(color: string | undefined, fallback: string) {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function hexToRgb(hex: string) {
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

function mixHex(hex: string, target: string, amount: number) {
  const from = hexToRgb(hex);
  const to = hexToRgb(target);
  const channel = (start: number, end: number) =>
    Math.round(start + (end - start) * amount)
      .toString(16)
      .padStart(2, "0");

  return `#${channel(from.r, to.r)}${channel(from.g, to.g)}${channel(
    from.b,
    to.b,
  )}`;
}

function createThemeStyle(
  shopSettings: Awaited<ReturnType<typeof getShopSettings>>,
): ThemeStyle {
  const primary = normalizeHexColor(shopSettings.primaryColor, "#f80050");
  const secondary = normalizeHexColor(shopSettings.secondaryColor, "#900030");

  return {
    "--primary": primary,
    "--primary-hover": mixHex(primary, "#111827", 0.16),
    "--primary-soft": mixHex(primary, "#ffffff", 0.92),
    "--primary-soft-foreground": mixHex(primary, "#111827", 0.46),
    "--secondary": secondary,
    "--secondary-hover": mixHex(secondary, "#111827", 0.16),
    "--ring": primary,
  } as ThemeStyle;
}

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
      images: [
        {
          url: "/brand/computer-house-logo.jpg",
          width: 200,
          height: 200,
          alt: `${shopSettings.businessName} logo`,
        },
      ],
    },
    icons: {
      icon: [{ url: "/brand/computer-house-logo.jpg", type: "image/jpeg" }],
      apple: [{ url: "/brand/computer-house-logo.jpg", type: "image/jpeg" }],
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const shopSettings = await getShopSettings();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={createThemeStyle(shopSettings)}
      >
        {children}
      </body>
    </html>
  );
}
