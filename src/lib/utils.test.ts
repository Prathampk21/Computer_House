import { describe, expect, it } from "vitest";

import { formatCurrency, slugify } from "@/lib/utils";

describe("utils", () => {
  it("formats INR currency for the shop locale", () => {
    expect(formatCurrency(42900)).toBe("₹42,900");
  });

  it("creates stable URL slugs", () => {
    expect(slugify("Dell Latitude 5420 Business Laptop")).toBe(
      "dell-latitude-5420-business-laptop",
    );
  });
});
