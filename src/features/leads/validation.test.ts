import { describe, expect, it } from "vitest";

import {
  productEnquirySchema,
  quoteRequestSchema,
} from "@/features/leads/validation";

describe("lead validation", () => {
  it("accepts a valid WhatsApp product enquiry", () => {
    const parsed = productEnquirySchema.parse({
      productSlug: "dell-latitude-5420-business-laptop",
      productName: "Dell Latitude 5420 Business Laptop",
      sku: "DL-LAT-5420-RF",
      sellingPrice: "42900",
      name: "Prathamesh Kiramate",
      mobile: "7391868111",
      email: "customer@example.com",
      message: "Please share best price.",
    });

    expect(parsed.sellingPrice).toBe(42900);
  });

  it("requires at least one product in a quote basket", () => {
    const parsed = quoteRequestSchema.safeParse({
      productSlugs: [],
      name: "Prathamesh Kiramate",
      mobile: "7391868111",
      email: "",
      message: "",
    });

    expect(parsed.success).toBe(false);
  });
});
