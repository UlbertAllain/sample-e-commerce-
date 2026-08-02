"use client";

import { apiFetch } from "@/lib/api/client";

type UploadSignature = {
  timestamp: number;
  signature: string;
  folder: string;
  cloudName: string;
  apiKey: string;
};

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
};

export async function uploadAdminImage(file: File): Promise<{ url: string; publicId: string }> {
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar.");
  if (file.size > 6 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 6 MB.");

  const signature = await apiFetch<UploadSignature>("/api/admin/uploads/signature", { method: "POST" });
  const formData = new FormData();
  formData.set("file", file);
  formData.set("api_key", signature.apiKey);
  formData.set("timestamp", String(signature.timestamp));
  formData.set("signature", signature.signature);
  formData.set("folder", signature.folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const payload = await response.json() as CloudinaryUploadResponse;
  if (!response.ok || !payload.secure_url || !payload.public_id) {
    throw new Error(payload.error?.message || "Upload Cloudinary gagal.");
  }

  return { url: payload.secure_url, publicId: payload.public_id };
}
