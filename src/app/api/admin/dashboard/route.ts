import { getDashboardSummary } from "@/features/admin/admin-repository";
import { ok, fail } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminSession();
    return ok(await getDashboardSummary());
  } catch (error) {
    return fail(error);
  }
}
