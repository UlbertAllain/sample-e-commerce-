import { ok, fail } from "@/lib/api/response";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getCustomerAccount, readSessionClaims } from "@/lib/server/session";
import type { CustomerAccount } from "@/types/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const claims = await readSessionClaims();
    if (!claims) return ok<CustomerAccount | null>(null);

    if (claims.role === "admin") {
      const record = await getAdminAuth().getUser(claims.uid);
      return ok<CustomerAccount>({
        id: claims.uid,
        role: "admin",
        profile: {
          fullName: record.displayName || claims.name || "Administrator",
          email: record.email || claims.email || "",
          phone: record.phoneNumber || "",
          province: "",
          city: "",
          district: "",
          postalCode: "",
          address: "",
        },
        createdAt: record.metadata.creationTime ? new Date(record.metadata.creationTime).toISOString() : new Date().toISOString(),
      });
    }

    return ok(await getCustomerAccount(claims.uid));
  } catch (error) {
    return fail(error);
  }
}
