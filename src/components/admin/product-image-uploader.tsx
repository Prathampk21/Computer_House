"use client";

import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { registerProductImage } from "@/features/admin/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const maxFileSize = 5 * 1024 * 1024;

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductImageUploader({
  productId,
  productName,
  imageCount,
}: {
  productId: string;
  productName: string;
  imageCount: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;

    const selectedFiles = Array.from(files);

    if (imageCount + selectedFiles.length > 8) {
      setMessage("A product can have up to 8 images.");
      return;
    }

    const invalidFile = selectedFiles.find(
      (file) => !allowedTypes.has(file.type) || file.size > maxFileSize,
    );

    if (invalidFile) {
      setMessage("Use JPEG, PNG, WebP, or AVIF images up to 5 MB each.");
      return;
    }

    setBusy(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();

    try {
      for (const file of selectedFiles) {
        const path = `${productId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: false,
          });

        if (error) throw error;

        const formData = new FormData();
        formData.set("productId", productId);
        formData.set("storagePath", path);
        formData.set("altText", productName);

        try {
          await registerProductImage(formData);
        } catch (registrationError) {
          await supabase.storage.from("product-images").remove([path]);
          throw registrationError;
        }
      }

      setMessage(
        `${selectedFiles.length} image${selectedFiles.length === 1 ? "" : "s"} uploaded.`,
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <label
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-fit cursor-pointer",
          busy && "pointer-events-none opacity-60",
        )}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Upload className="size-4" aria-hidden="true" />
        )}
        {busy ? "Uploading" : "Upload images"}
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          disabled={busy}
          onChange={(event) => void upload(event.target.files)}
        />
      </label>
      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
