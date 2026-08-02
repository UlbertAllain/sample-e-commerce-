import { categorySchema } from "@/features/catalog/schemas";
import { listCategories, upsertCategory } from "@/features/catalog/category-repository";
import { ok, fail } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/server/session";
import { requireSameOrigin } from "@/lib/server/request-security";

export async function GET() {
  try {
    await requireAdminSession();
    return ok(await listCategories());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await requireAdminSession();
    const input = categorySchema.parse(await request.json());
    return ok(await upsertCategory(input), 201);
  } catch (error) {
    return fail(error);
  }
}
