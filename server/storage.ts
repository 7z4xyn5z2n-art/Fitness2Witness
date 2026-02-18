// Fitness2Witness-main/server/storage.ts
import crypto from "node:crypto";

type UploadResult = { url: string };

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function sha1(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex");
}

/**
 * Upload a binary buffer to Cloudinary.
 * Expects env vars:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */
export async function storagePut(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadResult> {
  const cloudName = requireEnv("CLOUDINARY_CLOUD_NAME");
  const apiKey = requireEnv("CLOUDINARY_API_KEY");
  const apiSecret = requireEnv("CLOUDINARY_API_SECRET");

  // Put uploads under a predictable folder. Example key:
  // "checkins/123/1700000000000.jpg"
  // We'll use that as "public_id" so URLs are stable-ish.
  const publicId = key.replace(/\.[^/.]+$/, ""); // strip extension
  const folder = publicId.includes("/") ? publicId.split("/").slice(0, -1).join("/") : undefined;

  const timestamp = Math.floor(Date.now() / 1000);

  // Cloudinary signature: sort params and sha1("a=b&c=d" + api_secret)
  // We'll sign: folder, public_id, timestamp
  const paramsToSign: Record<string, string | number> = {
    timestamp,
    public_id: publicId,
  };
  if (folder) paramsToSign.folder = folder;

  const sorted = Object.keys(paramsToSign)
    .sort()
    .map((k) => `${k}=${paramsToSign[k]}`)
    .join("&");

  const signature = sha1(sorted + apiSecret);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  // Node 18+ has global FormData/Blob
  const form = new FormData();
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("public_id", publicId);
  if (folder) form.append("folder", folder);

  // Upload the binary
  const blob = new Blob([buffer], { type: contentType || "application/octet-stream" });
  form.append("file", blob, key.split("/").pop() || "upload");

  const res = await fetch(url, {
    method: "POST",
    body: form,
  });

  const json = (await res.json().catch(() => null)) as any;

  if (!res.ok) {
    const msg = json?.error?.message || `Cloudinary upload failed (${res.status})`;
    throw new Error(msg);
  }

  const uploadedUrl = json?.secure_url || json?.url;
  if (!uploadedUrl) throw new Error("Cloudinary upload succeeded but no URL returned.");

  return { url: uploadedUrl };
}
