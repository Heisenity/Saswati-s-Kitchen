import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";
import { buildStorageObjectKey, validateUploadFile } from "@/lib/security";

export const paymentProofUploadOptions = {
  maxBytes: 5 * 1024 * 1024
};

export const menuImageUploadOptions = {
  maxBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  allowedExtensions: ["jpg", "jpeg", "png", "webp"]
};

function sanitizeUploadName(fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+/, "");
  return safeName || `upload-${Date.now()}.bin`;
}

function classifyR2UploadError(error: unknown) {
  if (
    !env.r2AccountId ||
    !env.r2AccessKeyId ||
    !env.r2SecretAccessKey ||
    !env.r2Bucket ||
    !env.r2PublicUrl
  ) {
    return "missing_env";
  }

  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown R2 error";
  const normalized = message.toLowerCase();

  if (
    normalized.includes("accessdenied") ||
    normalized.includes("access denied") ||
    normalized.includes("invalidaccesskeyid") ||
    normalized.includes("signaturedoesnotmatch") ||
    normalized.includes("forbidden") ||
    normalized.includes("credentials")
  ) {
    return "bad_credentials";
  }

  if (
    normalized.includes("nosuchbucket") ||
    normalized.includes("bucket") ||
    normalized.includes("not found")
  ) {
    return "wrong_bucket";
  }

  if (
    normalized.includes("network") ||
    normalized.includes("timeout") ||
    normalized.includes("econn") ||
    normalized.includes("enotfound") ||
    normalized.includes("socket") ||
    normalized.includes("fetch failed")
  ) {
    return "network_only";
  }

  return "unknown";
}

function logR2UploadError(folder: string, error: unknown) {
  const classification = classifyR2UploadError(error);
  const payload =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      : { value: error };

  console.error("[r2:upload-failed]", {
    folder,
    classification,
    ...payload
  });
}

async function fileToDataUrl(file: File) {
  const mimeType = file.type || "application/octet-stream";
  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

function getClient() {
  if (!env.r2AccountId || !env.r2AccessKeyId || !env.r2SecretAccessKey || !env.r2Bucket) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.r2AccessKeyId,
      secretAccessKey: env.r2SecretAccessKey
    }
  });
}

export async function createPresignedR2Upload(input: {
  fileName: string;
  contentType: string;
  size: number;
  folder: "payment-proofs" | "menu-images";
  maxBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}) {
  const client = getClient();
  if (!client || !env.r2Bucket || !env.r2PublicUrl) {
    throw new Error("Cloudflare R2 is not configured.");
  }

  if (
    typeof input.fileName !== "string" ||
    typeof input.contentType !== "string" ||
    !Number.isInteger(input.size)
  ) {
    throw new Error("Invalid upload.");
  }

  const safeName = sanitizeUploadName(input.fileName);
  const extension = safeName.split(".").pop()?.toLowerCase() ?? "";
  if (
    input.size <= 0 ||
    input.size > input.maxBytes ||
    !input.allowedMimeTypes.includes(input.contentType) ||
    !input.allowedExtensions.includes(extension)
  ) {
    throw new Error("Invalid upload.");
  }

  const key = buildStorageObjectKey(input.folder, safeName);
  const command = new PutObjectCommand({
    Bucket: env.r2Bucket,
    Key: key,
    ContentType: input.contentType,
    ContentLength: input.size,
    CacheControl: input.folder === "menu-images" ? "public, max-age=31536000, immutable" : undefined
  });

  return {
    uploadUrl: await getSignedUrl(client, command, { expiresIn: 300 }),
    url: `${env.r2PublicUrl.replace(/\/$/, "")}/${key}`
  };
}

async function uploadFileToR2(
  file: File,
  folder: string,
  options?: {
    allowedMimeTypes: string[];
    allowedExtensions: string[];
    maxBytes: number;
  }
) {
  const client = getClient();
  if (!client || !env.r2Bucket || !env.r2PublicUrl) {
    throw new Error("Cloudflare R2 is not configured.");
  }

  const uploadMaxBytes = options?.maxBytes ?? 15 * 1024 * 1024;
  if (file.size <= 0 || file.size > uploadMaxBytes) {
    throw new Error("Invalid file size.");
  }

  const { bytes, originalName } = options
    ? await validateUploadFile(file, options)
    : {
        bytes: Buffer.from(await file.arrayBuffer()),
        originalName: sanitizeUploadName(file.name)
      };
  const fileName = buildStorageObjectKey(folder, originalName);

  await client.send(
    new PutObjectCommand({
      Bucket: env.r2Bucket,
      Key: fileName,
      Body: bytes,
      ContentType: file.type,
      CacheControl: folder === "menu-images" ? "public, max-age=31536000, immutable" : undefined
    })
  );

  return `${env.r2PublicUrl.replace(/\/$/, "")}/${fileName}`;
}

export async function uploadPaymentProof(file: File) {
  if (file.size <= 0 || file.size > paymentProofUploadOptions.maxBytes) {
    throw new Error("Attachment must be smaller than 5 MB.");
  }

  try {
    return await uploadFileToR2(file, "payment-proofs");
  } catch (error) {
    logR2UploadError("payment-proofs", error);
    // ponytail: if R2 is down or misconfigured, keep the proof inline so the order still lands in Supabase Postgres
    return fileToDataUrl(file);
  }
}

export async function uploadMenuImage(file: File) {
  return uploadFileToR2(file, "menu-images", {
    allowedMimeTypes: menuImageUploadOptions.allowedMimeTypes,
    allowedExtensions: menuImageUploadOptions.allowedExtensions,
    maxBytes: menuImageUploadOptions.maxBytes
  }).catch((error) => {
    logR2UploadError("menu-images", error);
    throw error;
  });
}

export async function uploadChatAttachment(file: File, maxBytes = 5 * 1024 * 1024) {
  try {
    return await uploadFileToR2(file, "chat-attachments", {
      allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
      allowedExtensions: ["jpg", "jpeg", "png", "pdf"],
      maxBytes
    });
  } catch (error) {
    logR2UploadError("chat-attachments", error);
    // ponytail: chat attachments can fall back inline the same way as payment proofs, so support does not block on R2
    return fileToDataUrl(file);
  }
}
