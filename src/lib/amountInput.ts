function normalizeIntegerPart(value: string): string {
  const onlyDigits = value.replace(/\D/g, "");
  const trimmed = onlyDigits.replace(/^0+(?=\d)/, "");
  return trimmed || "0";
}

export function normalizeArAmountInput(rawValue: string): string {
  const sanitized = rawValue.replace(/[^0-9.,]/g, "");
  if (!sanitized) {
    return "";
  }

  if (sanitized.includes(",")) {
    const [integerChunk, ...decimalChunks] = sanitized.split(",");
    const integerPart = normalizeIntegerPart(integerChunk);
    const decimalDigits = decimalChunks.join("").replace(/\D/g, "").slice(0, 2);

    if (decimalDigits.length > 0) {
      return `${integerPart}.${decimalDigits}`;
    }

    if (sanitized.endsWith(",")) {
      return `${integerPart}.`;
    }

    return integerPart;
  }

  const dotMatches = sanitized.match(/\./g);
  const dotCount = dotMatches ? dotMatches.length : 0;

  if (dotCount === 0) {
    return normalizeIntegerPart(sanitized);
  }

  if (dotCount > 1) {
    return normalizeIntegerPart(sanitized);
  }

  const [leftChunk, rightChunk] = sanitized.split(".");
  const leftDigits = normalizeIntegerPart(leftChunk);
  const rightDigits = rightChunk.replace(/\D/g, "");

  if (rightDigits.length <= 2) {
    if (rightDigits.length > 0) {
      return `${leftDigits}.${rightDigits}`;
    }

    if (sanitized.endsWith(".")) {
      return `${leftDigits}.`;
    }
  }

  return normalizeIntegerPart(`${leftChunk}${rightChunk}`);
}

export function formatArAmountInput(normalizedValue: string): string {
  if (!normalizedValue) {
    return "";
  }

  const hasDecimalSeparator = normalizedValue.includes(".");
  const [integerChunk, decimalChunk = ""] = normalizedValue.split(".");
  const integerPart = normalizeIntegerPart(integerChunk);
  const formattedInteger = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(Number(integerPart));

  if (!hasDecimalSeparator) {
    return formattedInteger;
  }

  if (!decimalChunk) {
    return `${formattedInteger},`;
  }

  return `${formattedInteger},${decimalChunk.slice(0, 2)}`;
}

export function parseNormalizedAmount(normalizedValue: string): number | null {
  if (!normalizedValue.trim()) {
    return null;
  }

  const parsed = Number.parseFloat(normalizedValue);
  return Number.isFinite(parsed) ? parsed : null;
}
