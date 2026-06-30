function getIndianMobileDigits(input: string) {
  const digits = input.trim().replace(/\D/g, "");

  if (!digits) return null;
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) return digits;
  if (digits.length === 11 && digits.startsWith("0")) {
    const local = digits.slice(1);
    return /^[6-9]\d{9}$/.test(local) ? local : null;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    const local = digits.slice(2);
    return /^[6-9]\d{9}$/.test(local) ? local : null;
  }

  const lastTen = digits.slice(-10);
  return /^[6-9]\d{9}$/.test(lastTen) ? lastTen : null;
}

export function normalizePhone(input: string) {
  const trimmed = input.trim();
  const localIndian = getIndianMobileDigits(trimmed);
  if (localIndian) return `+91${localIndian}`;

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (trimmed.startsWith("+")) return `+${digits}`;
  return `+${digits}`;
}

export function matchesPhone(left: string, right: string) {
  const leftIndian = getIndianMobileDigits(left);
  const rightIndian = getIndianMobileDigits(right);

  if (leftIndian && rightIndian) {
    return leftIndian === rightIndian;
  }

  return normalizePhone(left) === normalizePhone(right);
}
