export function compact(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function number(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(value);
}

export function percent(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value) ? "—" : `${number(value)}%`;
}
