import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";
import { buildStorageObjectKey, validateUploadFile } from "@/lib/security";

export const paymentProofUploadOptions = {
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  allowedExtensions: ["jpg", "jpeg", "png", "webp"],
  maxBytes: 8 * 1024 * 1024
};

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

async function uploadFileToR2(
  file: File,
  folder: string,
  options: {
    allowedMimeTypes: string[];
    allowedExtensions: string[];
    maxBytes: number;
  }
) {
  const client = getClient();
  if (!client || !env.r2Bucket || !env.r2PublicUrl) {
    throw new Error("Cloudflare R2 is not configured.");
  }

  const { bytes, originalName } = await validateUploadFile(file, options);
  const fileName = buildStorageObjectKey(folder, originalName);

  await client.send(
    new PutObjectCommand({
      Bucket: env.r2Bucket,
      Key: fileName,
      Body: bytes,
      ContentType: file.type
    })
  );

  return `${env.r2PublicUrl.replace(/\/$/, "")}/${fileName}`;
}

export async function uploadPaymentProof(file: File) {
  return uploadFileToR2(file, "payment-proofs", paymentProofUploadOptions);
}

export async function uploadMenuImage(file: File) {
  return uploadFileToR2(file, "menu-images", {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    allowedExtensions: ["jpg", "jpeg", "png", "webp"],
    maxBytes: 8 * 1024 * 1024
  });
}

export async function uploadChatAttachment(file: File) {
  return uploadFileToR2(file, "chat-attachments", {
    allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
    allowedExtensions: ["jpg", "jpeg", "png", "pdf"],
    maxBytes: 5 * 1024 * 1024
  });
}
