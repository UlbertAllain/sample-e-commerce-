import { getOrderByIdentifier } from "@/features/orders/order-repository";
import { ok, fail } from "@/lib/api/response";
import { requireSession } from "@/lib/server/session";

export async function GET(_: Request, { params }: { params: Promise<{ identifier: string }> }) {
  try {
    const session = await requireSession();
    const { identifier } = await params;
    const order = await getOrderByIdentifier(identifier, session);
    if (!order) throw new Error("NOT_FOUND");
    return ok(order);
  } catch (error) {
    return fail(error);
  }
}
