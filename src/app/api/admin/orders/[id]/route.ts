import { getOrderByIdentifier, updateOrder } from "@/features/orders/order-repository";
import { updateOrderSchema } from "@/features/orders/schemas";
import { ok, fail } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/server/session";
import { requireSameOrigin } from "@/lib/server/request-security";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession();
    const { id } = await params;
    const order = await getOrderByIdentifier(id, session);
    if (!order) throw new Error("NOT_FOUND");
    return ok(order);
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const session = await requireAdminSession();
    const { id } = await params;
    const input = updateOrderSchema.parse(await request.json());
    return ok(await updateOrder(id, input, session.uid));
  } catch (error) {
    return fail(error);
  }
}
