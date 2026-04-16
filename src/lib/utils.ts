import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrencyAmount(
  amount: number,
  currency: string = "ARS",
  locale: string = "es-AR",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getWeakCurrencyExchangeRateFromAmounts(
  sourceAmount: number | null | undefined,
  destinationAmount: number | null | undefined,
  sourceCurrency: string,
  destinationCurrency: string | null | undefined,
): { amount: number; currency: string } | null {
  if (
    sourceAmount == null ||
    destinationAmount == null ||
    !Number.isFinite(sourceAmount) ||
    !Number.isFinite(destinationAmount) ||
    sourceAmount <= 0 ||
    destinationAmount <= 0
  ) {
    return null
  }

  if (sourceAmount >= destinationAmount) {
    return {
      amount: sourceAmount / destinationAmount,
      currency: sourceCurrency,
    }
  }

  return {
    amount: destinationAmount / sourceAmount,
    currency: destinationCurrency ?? sourceCurrency,
  }
}
