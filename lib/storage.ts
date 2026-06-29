import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";

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

export async function uploadPaymentProof(file: File) {
  const client = getClient();
  if (!client || !env.r2Bucket || !env.r2PublicUrl) {
    throw new Error("Cloudflare R2 is not configured.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const fileName = `payment-proofs/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

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
