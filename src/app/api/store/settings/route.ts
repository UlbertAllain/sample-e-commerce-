import { getStoreSettings } from "@/features/admin/settings-repository";
import { ok, fail } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getStoreSettings();
    return ok({
      storeName: settings.storeName,
      supportPhone: settings.supportPhone,
      bankName: settings.bankName,
      bankAccountName: settings.bankAccountName,
      bankAccountNumber: settings.bankAccountNumber,
      qrisImageUrl: settings.qrisImageUrl,
      shippingServices: settings.shippingServices.filter((service) => service.isActive !== false),
      paymentMethods: settings.paymentMethods,
    });
  } catch (error) {
    return fail(error);
  }
}
