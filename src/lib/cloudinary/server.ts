import "server-only";

import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryEnv } from "@/config/env";

export function getCloudinaryConfig() {
  const env = getCloudinaryEnv();
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return { cloudinary, env };
}
