import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { ok, fail } from "@/lib/api/response";
import { getAdminDb } from "@/lib/firebase/admin";
import { getCustomerAccount, requireSession } from "@/lib/server/session";
import { requireSameOrigin } from "@/lib/server/request-security";

const schema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(8).max(30),
  province: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(4).max(10),
  address: z.string().trim().min(8).max(500),
});

export async function PATCH(request: Request) {
  try {
    requireSameOrigin(request);
    const session = await requireSession();
    if (session.role !== "customer") throw new Error("FORBIDDEN");
    const input = schema.parse(await request.json());
    if (session.email.toLowerCase() !== input.email.toLowerCase()) throw new Error("Email akun tidak dapat diubah dari halaman profil.");
    await getAdminDb().collection("customers").doc(session.uid).set({ ...input, email: input.email.toLowerCase(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return ok(await getCustomerAccount(session.uid));
  } catch (error) {
    return fail(error);
  }
}
