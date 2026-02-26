import { clsx } from "clsx";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs);
}

export function toDateInput(value?: Date | string | null) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString().slice(0, 10);
}

export function formatDate(value?: Date | string | null) {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium" }).format(d);
}

export function formatDateTime(value?: Date | string | null) {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function formatCurrencyJPY(amount: number) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY" }).format(amount);
}

export function renderTemplate(template: string, vars: Record<string, string | number | null | undefined>) {
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined || value === null ? "" : String(value);
  });
}
