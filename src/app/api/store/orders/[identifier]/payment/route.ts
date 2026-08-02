import { markOrderPaid } from "@/features/orders/order-repository";
import { ok, fail } from "@/lib/api/response";
import { requireSession } from "@/lib/server/session";
import { requireSameOrigin } from "@/lib/server/request-security";

export async function POST(request: Request, { params }: { params: Promise<{ identifier: string }> }) {
  try {
    requireSameOrigin(request);
    const session = await requireSession();
    if (session.role !== "customer") throw new Error("FORBIDDEN");
    const { identifier } = await params;
    return ok(await markOrderPaid(identifier, session.uid));
  } catch (error) {
    return fail(error);
  }
}
