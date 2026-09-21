export function parseDiscountPercent(tier?: string, fallback: number = 10): number {
  const match = (tier || '').match(/(\d+)\s*%/);
  if (match) {
    return Number(match[1]);
  }
  return fallback;
}

export function wholesalePrice(retailPrice: number, percent: number): number {
  return Math.round(retailPrice * (1 - percent / 100));
}
