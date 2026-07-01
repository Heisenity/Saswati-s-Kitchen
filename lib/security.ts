import { NextResponse } from "next/server";
import { env, isDatabaseConfigured } from "@/lib/env";
import { isPrismaConnectionError, prisma } from "@/lib/prisma";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type UploadValidationOptions = {
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  maxBytes: number;
};

type AdminActionInput = {
  adminId: string;
  email: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function cleanExpiredRateLimitEntries(now: number) {
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) rateLimitStore.delete(key);
  }
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip")?.trim() ?? "unknown";
}

export function rejectJson(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

export function applyRateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  cleanExpiredRateLimitEntries(now);

  const bucketKey = `${options.key}:${getClientIp(request)}`;
  const existing = rateLimitStore.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (existing.count >= options.limit) {
    return rejectJson(429, "Too many requests. Please try again shortly.");
  }

  existing.count += 1;
  rateLimitStore.set(bucketKey, existing);
  return null;
}

export function hasTrustedOrigin(request: Request) {
  if (!mutatingMethods.has(request.method.toUpperCase())) return true;

  const trustedOrigins = new Set<string>();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = request.headers.get("host")?.trim();
  const secFetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();

  try {
    trustedOrigins.add(new URL(env.appUrl).origin);
  } catch {
    // ponytail: local fallback covers misconfigured public app URL
  }

  try {
    trustedOrigins.add(new URL(request.url).origin);
  } catch {
    // ponytail: keep checking forwarded/public origins below
  }

  if (forwardedProto && forwardedHost) {
    trustedOrigins.add(`${forwardedProto}://${forwardedHost}`);
  }

  if (host) {
    trustedOrigins.add(`${forwardedProto ?? "https"}://${host}`);
    trustedOrigins.add(`http://${host}`);
    trustedOrigins.add(`https://${host}`);
  }

  const candidates = [request.headers.get("origin"), request.headers.get("referer")]
    .filter(Boolean)
    .map((value) => {
      try {
        return new URL(value as string).origin;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (!candidates.length) {
    return process.env.NODE_ENV === "development" || secFetchSite === "same-origin" || secFetchSite === "same-site" || secFetchSite === "none";
  }

  return candidates.some((origin) => origin && trustedOrigins.has(origin));
}

export function requireTrustedOrigin(request: Request) {
  if (hasTrustedOrigin(request)) return null;
  return rejectJson(403, "Forbidden");
}

function hasAllowedExtension(fileName: string, allowedExtensions: string[]) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return allowedExtensions.includes(extension);
}

function matchesFileSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
  }

  if (mimeType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }

  if (mimeType === "image/webp") {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }

  if (mimeType === "application/pdf") {
    return (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46
    );
  }

  return false;
}

export async function validateUploadFile(file: File, options: UploadValidationOptions) {
  if (!options.allowedMimeTypes.includes(file.type)) {
    throw new Error("Invalid file type.");
  }

  if (file.size <= 0 || file.size > options.maxBytes) {
    throw new Error("Invalid file size.");
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+/, "");
  if (!safeName || !hasAllowedExtension(safeName, options.allowedExtensions)) {
    throw new Error("Invalid file extension.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesFileSignature(bytes, file.type)) {
    throw new Error("Invalid file contents.");
  }

  return {
    bytes: Buffer.from(bytes),
    originalName: safeName
  };
}

export function buildStorageObjectKey(folder: string, fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  return `${folder}/${crypto.randomUUID()}.${extension}`;
}

export async function logAdminAction(input: AdminActionInput) {
  console.info(
    JSON.stringify({
      type: "admin_action",
      at: new Date().toISOString(),
      ...input
    })
  );
}

export async function logDeniedAdminLogin(request: Request, email?: string | null) {
  if (!isDatabaseConfigured()) return;

  try {
    await prisma.adminHack.create({
      data: {
        email: email ?? null,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent")
      }
    });
  } catch (error) {
    if (!isPrismaConnectionError(error)) throw error;
  }
}
