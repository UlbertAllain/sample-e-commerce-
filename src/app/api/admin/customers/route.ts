import { listCustomers } from "@/features/admin/admin-repository";
import { ok, fail } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/server/session";

export async function GET() {
  try {
    await requireAdminSession();
    return ok(await listCustomers());
  } catch (error) {
    return fail(error);
  }
}
