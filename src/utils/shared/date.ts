export function formatStringOrDate(value: string | Date | undefined): string {
  if (value instanceof Date) {
    return value.toLocaleDateString("cs");
  }
  return value || "-";
}