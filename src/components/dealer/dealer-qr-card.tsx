"use client";

import { Copy, MessageCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function DealerQrCard({ referralUrl }: { referralUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-lg border bg-white p-5">
      <div className="grid place-items-center rounded-lg bg-slate-50 p-5">
        <QRCodeSVG value={referralUrl} size={164} />
      </div>
      <p className="mt-4 break-all rounded-md bg-slate-50 p-3 text-xs text-slate-700">
        {referralUrl}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button type="button" onClick={copyLink} variant="outline">
          <Copy className="size-4" aria-hidden="true" />
          {copied ? "Copied" : "Copy link"}
        </Button>
        <Button asChild>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(referralUrl)}`}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Share
          </a>
        </Button>
      </div>
    </div>
  );
}
