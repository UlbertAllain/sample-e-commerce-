import { z } from "zod";
import { getStoreSettings, updateStoreSettings } from "@/features/admin/settings-repository";
import { ok, fail } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/server/session";
import { requireSameOrigin } from "@/lib/server/request-security";

const schema = z.object({
  storeName: z.string().trim().min(2),
  supportPhone: z.string().trim().min(6),
  supportEmail: z.string().trim().email(),
  address: z.string().trim().min(8),
  bankName: z.string().trim().min(2),
  bankAccountName: z.string().trim().min(2),
  bankAccountNumber: z.string().trim().min(4),
  qrisImageUrl: z.string().url().optional().or(z.literal("")),
  shippingServices: z.array(z.object({
    id: z.string().min(1), courier: z.string().min(1), service: z.string().min(1), eta: z.string().min(1), price: z.coerce.number().nonnegative(), description: z.string().min(1), isActive: z.boolean().optional(),
  })),
  paymentMethods: z.array(z.enum(["bank-transfer", "qris", "cod"])).min(1),
});

export async function GET() {
  try {
    await requireAdminSession();
    return ok(await getStoreSettings());
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    requireSameOrigin(request);
    await requireAdminSession();
    const input = schema.parse(await request.json());
    return ok(await updateStoreSettings({ ...input, qrisImageUrl: input.qrisImageUrl || undefined }));
  } catch (error) {
    return fail(error);
  }
}
