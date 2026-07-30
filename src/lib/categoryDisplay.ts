const FALLBACK_PALETTE = [
  "#c06a2b",
  "#2563a8",
  "#6d28d9",
  "#b91c1c",
  "#9333ea",
  "#c2620e",
  "#2d6a4f",
  "#8a8a84",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getCategoryColor(category: { id: string; color: string | null }): string {
  if (category.color) return category.color;
  return FALLBACK_PALETTE[hashString(category.id) % FALLBACK_PALETTE.length];
}

export function getCategoryEmoji(category: { name: string; emoji: string | null }): string {
  if (category.emoji) return category.emoji;
  return category.name.charAt(0).toUpperCase();
}
