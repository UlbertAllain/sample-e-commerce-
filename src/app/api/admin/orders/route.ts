import { listOrders } from "@/features/orders/order-repository";
import { ok, fail } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/server/session";

export async function GET() {
  try {
    await requireAdminSession();
    return ok(await listOrders());
  } catch (error) {
    return fail(error);
  }
}
