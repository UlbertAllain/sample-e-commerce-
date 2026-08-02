import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getSessionConfig } from "@/config/env";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { toIso } from "@/lib/firebase/firestore";
import type { CustomerAccount, UserRole } from "@/types/auth";

export type SessionUser = {
  uid: string;
  email: string;
  role: UserRole;
  name: string;
};

function roleFromClaims(claims: DecodedIdToken): UserRole {
  return claims.role === "admin" ? "admin" : "customer";
}

export async function readSessionClaims(): Promise<DecodedIdToken | null> {
  const store = await cookies();
  const token = store.get(getSessionConfig().name)?.value;
  if (!token) return null;

  try {
    return await getAdminAuth().verifySessionCookie(token, true);
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<SessionUser> {
  const claims = await readSessionClaims();
  if (!claims) throw new Error("UNAUTHENTICATED");

  return {
    uid: claims.uid,
    email: claims.email ?? "",
    role: roleFromClaims(claims),
    name: typeof claims.name === "string" ? claims.name : "Pengguna",
  };
}

export async function requireAdminSession(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== "admin") throw new Error("FORBIDDEN");
  return session;
}

export async function requireAdminPage() {
  try {
    return await requireAdminSession();
  } catch {
    redirect("/admin/login");
  }
}

export async function getCustomerAccount(uid: string): Promise<CustomerAccount | null> {
  const snapshot = await getAdminDb().collection("customers").doc(uid).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data() ?? {};
  return {
    id: uid,
    role: "customer",
    profile: {
      fullName: String(data.fullName ?? ""),
      email: String(data.email ?? ""),
      phone: String(data.phone ?? ""),
      province: String(data.province ?? ""),
      city: String(data.city ?? ""),
      district: String(data.district ?? ""),
      postalCode: String(data.postalCode ?? ""),
      address: String(data.address ?? ""),
    },
    createdAt: toIso(data.createdAt),
  };
}
