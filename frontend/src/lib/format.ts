const LOCALE = "es-CO";

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return dateTimeFormatter.format(new Date(iso));
}

/** "hace 5 minutos", "ayer", "hace 3 días". */
export function formatRelative(iso: string) {
  const diffSeconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSeconds);
  if (abs < 60) return "hace un momento";
  if (abs < 3600) return relativeFormatter.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86_400) return relativeFormatter.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 2_592_000) return relativeFormatter.format(Math.round(diffSeconds / 86_400), "day");
  return formatDate(iso);
}

/** Edad legible a partir de meses: "8 meses", "1 año", "3 años y 2 meses". */
export function formatAge(months: number) {
  if (months < 12) return `${months} ${months === 1 ? "mes" : "meses"}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const yearsText = `${years} ${years === 1 ? "año" : "años"}`;
  if (rest === 0 || years >= 3) return yearsText;
  return `${yearsText} y ${rest} ${rest === 1 ? "mes" : "meses"}`;
}

export function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toLocaleString(LOCALE, { maximumFractionDigits: 1 })} km`;
}

export function formatNumber(value: number) {
  return value.toLocaleString(LOCALE);
}
