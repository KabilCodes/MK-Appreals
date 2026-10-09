/**
 * Format numeric value as Indian Rupee (INR ₹)
 * e.g., 3500 -> "₹3,500.00" or "₹3,500"
 */
export function formatCurrency(amount: number, showDecimals: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return showDecimals ? "₹0.00" : "₹0";
  }

  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(rounded);
}

/**
 * Format piece rate, e.g. 2.5 -> "₹2.50"
 */
export function formatRate(rate: number): string {
  if (isNaN(rate) || rate === null || rate === undefined) {
    return "₹0.00";
  }
  return `₹${rate.toFixed(2)}`;
}

/**
 * Deterministic earnings calculation with exact 2-decimal precision
 */
export function calculateEarnings(pieceCount: number, rate: number): number {
  if (pieceCount <= 0 || rate <= 0) return 0;
  return Math.round((pieceCount * rate + Number.EPSILON) * 100) / 100;
}
