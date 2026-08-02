import { productSchema } from "@/features/catalog/schemas";
import { createProduct, listProducts } from "@/features/catalog/product-repository";
import { ok, fail } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/server/session";
import { requireSameOrigin } from "@/lib/server/request-security";

export async function GET() {
  try {
    await requireAdminSession();
    return ok(await listProducts());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await requireAdminSession();
    const input = productSchema.parse(await request.json());
    return ok(await createProduct(input), 201);
  } catch (error) {
    return fail(error);
  }
}
