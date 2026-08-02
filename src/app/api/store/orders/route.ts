import { createOrderSchema } from "@/features/orders/schemas";
import { createOrder, listOrders } from "@/features/orders/order-repository";
import { ok, fail } from "@/lib/api/response";
import { requireSession } from "@/lib/server/session";
import { requireSameOrigin } from "@/lib/server/request-security";

export async function GET() {
  try {
    const session = await requireSession();
    if (session.role !== "customer") throw new Error("FORBIDDEN");
    return ok(await listOrders({ customerId: session.uid }));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const session = await requireSession();
    if (session.role !== "customer") throw new Error("FORBIDDEN");
    const input = createOrderSchema.parse(await request.json());
    const order = await createOrder({ customerId: session.uid, ...input });
    return ok(order, 201);
  } catch (error) {
    return fail(error);
  }
}
