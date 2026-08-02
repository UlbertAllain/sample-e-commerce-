import { ok, fail } from "@/lib/api/response";
import { getCloudinaryConfig } from "@/lib/cloudinary/server";
import { requireAdminSession } from "@/lib/server/session";
import { requireSameOrigin } from "@/lib/server/request-security";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await requireAdminSession();
    const { cloudinary, env } = getCloudinaryConfig();
    const timestamp = Math.round(Date.now() / 1000);
    const params = { timestamp, folder: env.CLOUDINARY_UPLOAD_FOLDER };
    const signature = cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET);
    return ok({ timestamp, signature, folder: env.CLOUDINARY_UPLOAD_FOLDER, cloudName: env.CLOUDINARY_CLOUD_NAME, apiKey: env.CLOUDINARY_API_KEY });
  } catch (error) {
    return fail(error);
  }
}
