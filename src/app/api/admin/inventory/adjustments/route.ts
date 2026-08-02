import { adjustInventory, listInventoryMovements } from "@/features/admin/admin-repository";
import { inventoryAdjustmentSchema } from "@/features/catalog/schemas";
import { ok, fail } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/server/session";
import { requireSameOrigin } from "@/lib/server/request-security";

export async function GET() {
  try {
    await requireAdminSession();
    return ok(await listInventoryMovements());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const session = await requireAdminSession();
    const input = inventoryAdjustmentSchema.parse(await request.json());
    return ok(await adjustInventory(input, session.uid), 201);
  } catch (error) {
    return fail(error);
  }
}
