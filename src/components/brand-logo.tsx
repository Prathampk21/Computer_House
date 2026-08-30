import Image from "next/image";

import { cn } from "@/lib/utils";

const logoSizes = {
  sm: { className: "size-9", pixels: 36 },
  md: { className: "size-10", pixels: 40 },
  lg: { className: "size-12", pixels: 48 },
};

export function BrandLogo({
  className,
  priority = false,
  size = "md",
}: {
  className?: string;
  priority?: boolean;
  size?: keyof typeof logoSizes;
}) {
  const logoSize = logoSizes[size];

  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-md border border-white/70 bg-primary shadow-sm",
        logoSize.className,
        className,
      )}
    >
      <Image
        src="/brand/computer-house-logo.jpg"
        alt="Computer House logo"
        width={logoSize.pixels}
        height={logoSize.pixels}
        priority={priority}
        className="size-full object-cover"
      />
    </span>
  );
}
