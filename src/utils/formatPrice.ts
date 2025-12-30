export const formatPrice = (num: number): string => {
  if (num === 0) return "$0.00";

  if (num >= 1) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    }).format(num);
  }

  const absNum = Math.abs(num);
  const magnitude = Math.floor(Math.log10(absNum));
  const decimalPlaces = Math.max(3, -magnitude + 2);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(num);
};
