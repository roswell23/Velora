export function toCents(value) {
  const [wholePart, fractionPart = ""] = String(value).split(".");
  const sign = wholePart.startsWith("-") ? -1n : 1n;
  const whole = BigInt(wholePart || "0");
  const fraction = BigInt((fractionPart.replace(/\D/g, "") + "00").slice(0, 2));
  return whole * 100n + sign * fraction;
}

export function formatCents(cents) {
  const amount = BigInt(cents);
  const sign = amount < 0n ? "-" : "";
  const absoluteAmount = amount < 0n ? -amount : amount;
  const whole = absoluteAmount / 100n;
  const fraction = absoluteAmount % 100n;
  const formattedWhole = new Intl.NumberFormat("en-US").format(whole);
  const formattedFraction = fraction === 0n ? "" : `.${fraction.toString().padStart(2, "0")}`;
  return `${sign}$${formattedWhole}${formattedFraction}`;
}

export function formatPrice(value) {
  return formatCents(toCents(value));
}
