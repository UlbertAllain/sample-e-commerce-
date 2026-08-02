import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { toIso } from "@/lib/firebase/firestore";
import type { Category } from "@/types/commerce";

function mapCategory(id: string, data: FirebaseFirestore.DocumentData): Category {
  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    icon: String(data.icon ?? "•"),
    isActive: data.isActive !== false,
    order: Number(data.order ?? 0),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function listCategories(publicOnly = false): Promise<Category[]> {
  let query: FirebaseFirestore.Query = getAdminDb().collection("categories");
  if (publicOnly) query = query.where("isActive", "==", true);
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => mapCategory(doc.id, doc.data())).sort((a, b) => a.order - b.order);
}

export async function upsertCategory(category: Category): Promise<Category> {
  const ref = getAdminDb().collection("categories").doc(category.id);
  const existing = await ref.get();
  await ref.set({ ...category, createdAt: existing.exists ? existing.data()?.createdAt : FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  const updated = await ref.get();
  return mapCategory(updated.id, updated.data() ?? {});
}

export async function archiveCategory(id: string) {
  const ref = getAdminDb().collection("categories").doc(id);
  const existing = await ref.get();
  if (!existing.exists) throw new Error("NOT_FOUND");
  await ref.update({ isActive: false, updatedAt: FieldValue.serverTimestamp() });
}
