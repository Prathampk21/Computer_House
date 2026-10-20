import { describe, expect, it } from "vitest";

import { parseProductSlugs } from "@/features/catalog/comparison";

describe("comparison selection", () => {
  it("keeps multiple repeated query parameters", () => {
    expect(parseProductSlugs(["dell-latitude", "hp-probook"])).toEqual([
      "dell-latitude",
      "hp-probook",
    ]);
  });

  it("supports comma-separated quote links and removes duplicates", () => {
    expect(
      parseProductSlugs("dell-latitude,hp-probook,dell-latitude,lenovo-thinkpad"),
    ).toEqual(["dell-latitude", "hp-probook", "lenovo-thinkpad"]);
  });

  it("limits a comparison to four products", () => {
    expect(parseProductSlugs("one,two,three,four,five")).toHaveLength(4);
  });
});
