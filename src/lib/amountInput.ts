function normalizeIntegerPart(value: string): string {
  const onlyDigits = value.replace(/\D/g, "");
  const trimmed = onlyDigits.replace(/^0+(?=\d)/, "");
  return trimmed || "0";
}

function hasMultipleSeparators(value: string): boolean {
  const separators = value.replace(/[^,.]/g, "");
  return separators.length > 1;
}

function getFirstSeparator(value: string): "comma" | "period" | null {
  const commaIndex = value.indexOf(",");
  const periodIndex = value.indexOf(".");
  if (commaIndex === -1 && periodIndex === -1) return null;
  if (commaIndex === -1) return "period";
  if (periodIndex === -1) return "comma";
  return commaIndex < periodIndex ? "comma" : "period";
}

export function sanitizeAmountInput(rawValue: string): string {
  if (!rawValue) {
    return "";
  }

  const sanitized = rawValue.replace(/[^0-9.,]/g, "");
  if (!sanitized) {
    return "";
  }

  const withCommaInsteadOfPeriod = sanitized.replace(/\./g, ",");

  if (hasMultipleSeparators(withCommaInsteadOfPeriod)) {
    const separator = getFirstSeparator(withCommaInsteadOfPeriod);
    if (separator === null) {
      return normalizeIntegerPart(withCommaInsteadOfPeriod);
    }

    const parts = withCommaInsteadOfPeriod.split(separator === "comma" ? "," : ".");
    const integerPart = normalizeIntegerPart(parts[0] || "");
    const decimalPart = parts.slice(1).join("").replace(/\D/g, "").slice(0, 2);

    if (decimalPart) {
      return `${integerPart},${decimalPart}`;
    }

    return integerPart;
  }

  const separator = getFirstSeparator(withCommaInsteadOfPeriod);
  if (separator === null) {
    return normalizeIntegerPart(withCommaInsteadOfPeriod);
  }

  const [integerPart, decimalPart] = withCommaInsteadOfPeriod.split(",");
  const normalizedInteger = normalizeIntegerPart(integerPart || "");

  if (!decimalPart) {
    if (withCommaInsteadOfPeriod.endsWith(",")) {
      return `${normalizedInteger},`;
    }
    return normalizedInteger;
  }

  const cleanedDecimal = decimalPart.replace(/\D/g, "").slice(0, 2);
  if (cleanedDecimal) {
    return `${normalizedInteger},${cleanedDecimal}`;
  }

  return normalizedInteger;
}

export function formatAmountForDisplay(sanitizedValue: string): string {
  if (!sanitizedValue) {
    return "";
  }

  const hasDecimalSeparator = sanitizedValue.includes(",");
  const [integerChunk, decimalChunk = ""] = sanitizedValue.split(",");
  const integerPart = normalizeIntegerPart(integerChunk);

  if (integerPart === "0" && !hasDecimalSeparator) {
    return "0";
  }

  const formattedInteger = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0,
  }).format(Number(integerPart));

  if (!hasDecimalSeparator) {
    return formattedInteger;
  }

  if (!decimalChunk) {
    return `${formattedInteger},`;
  }

  return `${formattedInteger},${decimalChunk}`;
}

export function getRawAmount(formattedValue: string): string {
  if (!formattedValue) {
    return "";
  }

  const withoutThousandsSeparators = formattedValue.replace(/\./g, "");

  if (!withoutThousandsSeparators) {
    return "";
  }

  return withoutThousandsSeparators;
}

export function parseAmountForSubmission(sanitizedValue: string): number | null {
  if (!sanitizedValue.trim()) {
    return null;
  }

  const withPeriodInsteadOfComma = sanitizedValue.replace(/,/g, ".");
  const parsed = Number.parseFloat(withPeriodInsteadOfComma);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeArAmountInput(rawValue: string): string {
  return sanitizeAmountInput(rawValue);
}

export function formatArAmountInput(normalizedValue: string): string {
  return formatAmountForDisplay(normalizedValue);
}

export function parseNormalizedAmount(normalizedValue: string): number | null {
  return parseAmountForSubmission(normalizedValue);
}