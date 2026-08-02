import { bootstrapStoreData } from "@/features/admin/bootstrap-service";
import { ok, fail } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/server/session";
import { requireSameOrigin } from "@/lib/server/request-security";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await requireAdminSession();
    return ok(await bootstrapStoreData());
  } catch (error) {
    return fail(error);
  }
}
