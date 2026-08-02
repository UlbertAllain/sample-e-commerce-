import { listCategories } from "@/features/catalog/category-repository";
import { ok, fail } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await listCategories(true));
  } catch (error) {
    return fail(error);
  }
}
