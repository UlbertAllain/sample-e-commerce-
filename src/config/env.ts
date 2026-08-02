import "server-only";

import { z, type ZodError } from "zod";

const firebaseAdminSchema = z.object({
  FIREBASE_ADMIN_PROJECT_ID: z.string().min(1),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().email(),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().min(1),
});

const cloudinarySchema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_UPLOAD_FOLDER: z.string().min(1).default("berkah-oyot/products"),
});

function formatMissing(error: ZodError) {
  return error.issues.map((issue) => issue.path.join(".")).join(", ");
}

export function getFirebaseAdminEnv() {
  const parsed = firebaseAdminSchema.safeParse(process.env);
  if (!parsed.success) throw new Error(`Environment Firebase Admin belum lengkap: ${formatMissing(parsed.error)}`);
  return {
    ...parsed.data,
    FIREBASE_ADMIN_PRIVATE_KEY: parsed.data.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
}

export function getCloudinaryEnv() {
  const parsed = cloudinarySchema.safeParse(process.env);
  if (!parsed.success) throw new Error(`Environment Cloudinary belum lengkap: ${formatMissing(parsed.error)}`);
  return parsed.data;
}

export function getSessionConfig() {
  const days = Number(process.env.SESSION_COOKIE_DAYS || 7);
  return {
    name: process.env.SESSION_COOKIE_NAME || "__berkah_oyot_session",
    days: Number.isInteger(days) && days >= 1 && days <= 14 ? days : 7,
  };
}
