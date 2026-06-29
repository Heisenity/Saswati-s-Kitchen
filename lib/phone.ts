export function normalizePhone(input: string) {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) return "";
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return `+${digits}`;
}

export function matchesPhone(left: string, right: string) {
  return normalizePhone(left) === normalizePhone(right);
}
