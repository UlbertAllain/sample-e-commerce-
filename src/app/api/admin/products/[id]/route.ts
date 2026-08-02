import { productSchema } from "@/features/catalog/schemas";
import { archiveProduct, getProduct, updateProduct } from "@/features/catalog/product-repository";
import { ok, fail } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/server/session";
import { requireSameOrigin } from "@/lib/server/request-security";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession();
    const { id } = await params;
    const product = await getProduct(id);
    if (!product) throw new Error("NOT_FOUND");
    return ok(product);
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    await requireAdminSession();
    const { id } = await params;
    const input = productSchema.partial().parse(await request.json());
    const editable = { ...input };
    delete editable.stock;
    delete editable.sold;
    return ok(await updateProduct(id, editable));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    await requireAdminSession();
    const { id } = await params;
    await archiveProduct(id);
    return ok({ archived: true });
  } catch (error) {
    return fail(error);
  }
}
