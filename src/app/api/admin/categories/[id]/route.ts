import { categorySchema } from "@/features/catalog/schemas";
import { archiveCategory, upsertCategory } from "@/features/catalog/category-repository";
import { ok, fail } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/server/session";
import { requireSameOrigin } from "@/lib/server/request-security";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    await requireAdminSession();
    const { id } = await params;
    const input = categorySchema.parse({ ...(await request.json()), id });
    return ok(await upsertCategory(input));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    await requireAdminSession();
    const { id } = await params;
    await archiveCategory(id);
    return ok({ archived: true });
  } catch (error) {
    return fail(error);
  }
}
