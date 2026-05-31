export function calculateSessionCost(pricePerHour, elapsedMs) {
  if (!Number.isFinite(pricePerHour) || pricePerHour <= 0 || !Number.isFinite(elapsedMs)) {
    return 0;
  }
  return Math.round((pricePerHour * elapsedMs) / (1000 * 60 * 60));
}

export function formatPkr(amount) {
  return `Rs ${Math.max(0, Math.round(amount)).toLocaleString()}`;
}
