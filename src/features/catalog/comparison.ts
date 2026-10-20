export function parseProductSlugs(value?: string | string[]) {
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return Array.from(
    new Set(
      values
        .flatMap((item) => item.split(","))
        .map((slug) => slug.trim())
        .filter(Boolean),
    ),
  ).slice(0, 4);
}
