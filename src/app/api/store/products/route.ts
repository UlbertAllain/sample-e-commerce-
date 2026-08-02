import { listProducts } from "@/features/catalog/product-repository";
import { ok, fail } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await listProducts({ publicOnly: true }));
  } catch (error) {
    return fail(error);
  }
}
