import type { Dictionary } from "./dictionaries/en";

export function localizedCategoryLabel(
  dict: Dictionary,
  category: string | null,
  other: string | null,
): string | null {
  if (!category) return null;
  if (category === "other") return other || dict.categories.other;
  const mapped = dict.categories[category as keyof Dictionary["categories"]];
  return mapped ?? category;
}
