import { cookies } from "next/headers";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getSessionConfig } from "@/config/env";
import { ok, fail } from "@/lib/api/response";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { requireSameOrigin } from "@/lib/server/request-security";

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(8).max(30),
  province: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(4).max(10),
  address: z.string().trim().min(8).max(500),
});

const inputSchema = z.object({
  idToken: z.string().min(20),
  profile: profileSchema.optional(),
});

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const input = inputSchema.parse(await request.json());
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(input.idToken, true);
    const config = getSessionConfig();
    const expiresIn = config.days * 24 * 60 * 60 * 1000;
    const sessionCookie = await auth.createSessionCookie(input.idToken, { expiresIn });

    if (input.profile) {
      if (decoded.email?.toLowerCase() !== input.profile.email.toLowerCase()) {
        throw new Error("Email profil tidak sesuai dengan akun Firebase.");
      }
      const ref = getAdminDb().collection("customers").doc(decoded.uid);
      const existing = await ref.get();
      await ref.set({
        ...input.profile,
        email: input.profile.email.toLowerCase(),
        createdAt: existing.exists ? existing.data()?.createdAt : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    const store = await cookies();
    store.set(config.name, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn / 1000,
    });

    return ok({ role: decoded.role === "admin" ? "admin" : "customer" });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request) {
  requireSameOrigin(request);
  const config = getSessionConfig();
  const store = await cookies();
  store.set(config.name, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return ok({ loggedOut: true });
}
