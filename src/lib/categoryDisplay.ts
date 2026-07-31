const FALLBACK_PALETTE = [
  "#95cdeb", // celeste
  "#1f78b4", // azul
  "#08b2a7", // turquesa
  "#b2df8a", // verde claro
  "#33a02c", // verde
  "#fb9a99", // rosa/salmón
  "#e31a1c", // rojo
  "#fdbf6f", // naranja claro
  "#ff7f00", // naranja
  "#b15928", // marrón
  "#cab2d6", // lila
  "#6a3d9a", // violeta
  "#e3e342", // amarillo
  "#8a8a84", // gris
];

export { FALLBACK_PALETTE as CATEGORY_COLORS };

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
