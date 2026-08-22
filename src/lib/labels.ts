import { CATEGORIES } from "./schema";

export function categoryLabel(category: string | null, other: string | null) {
  if (!category) return null;
  if (category === "other") return other || CATEGORIES.other;
  return CATEGORIES[category as keyof typeof CATEGORIES] ?? category;
}
