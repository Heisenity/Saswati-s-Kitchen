const chatAttachmentPrefix = "__ATTACHMENT__:";

export type ChatAttachment = {
  url: string;
  name: string;
  mimeType: string;
};

export function normalizeIndianMobile(input: string) {
  const digits = input.replace(/\D/g, "");

  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits;
}

export function isValidIndianMobile(input: string) {
  return /^[6-9]\d{9}$/.test(normalizeIndianMobile(input));
}

export function sanitizeHumanName(input: string) {
  return input
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^A-Za-z.' -]/g, "");
}

export function isLikelyHumanName(input: string) {
  const value = sanitizeHumanName(input);
  if (value.length < 2 || value.length > 40) return false;
  if (!/[A-Za-z]{2}/.test(value)) return false;
  if (/^(.)\1{3,}$/i.test(value.replace(/\s/g, ""))) return false;

  const compact = value.replace(/[^A-Za-z]/g, "");
  if (compact.length >= 4 && !/[aeiou]/i.test(compact)) return false;
  if (/(.)\1\1/i.test(compact)) return false;
  return true;
}

export function formatChatTime(date: string | Date) {
  const value =
    typeof date === "string" && !/(z|[+-]\d{2}:?\d{2})$/i.test(date)
      ? `${date}Z`
      : date;

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  }).format(new Date(value));
}

export function serializeChatAttachment(attachment: ChatAttachment) {
  return `${chatAttachmentPrefix}${JSON.stringify(attachment)}`;
}

export function parseChatAttachment(message: string) {
  if (!message.startsWith(chatAttachmentPrefix)) return null;

  try {
    const parsed = JSON.parse(message.slice(chatAttachmentPrefix.length)) as Partial<ChatAttachment>;
    if (!parsed.url || !parsed.name || !parsed.mimeType) return null;
    return parsed as ChatAttachment;
  } catch {
    return null;
  }
}
