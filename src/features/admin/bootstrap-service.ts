import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { getStoreSettings } from "@/features/admin/settings-repository";
import { getAdminDb } from "@/lib/firebase/admin";
import { stripUndefined } from "@/lib/firebase/firestore";

export async function bootstrapStoreData() {
  const db = getAdminDb();
  const [productSnapshot, categorySnapshot] = await Promise.all([
    db.collection("products").limit(1).get(),
    db.collection("categories").limit(1).get(),
  ]);

  let importedProducts = 0;
  let importedCategories = 0;
  const batch = db.batch();

  if (productSnapshot.empty) {
    for (const product of products) {
      batch.set(db.collection("products").doc(product.id), stripUndefined({
        ...product,
        status: "active",
        minimumStock: 5,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }));
      importedProducts += 1;
    }
  }

  if (categorySnapshot.empty) {
    for (const category of categories) {
      batch.set(db.collection("categories").doc(category.id), {
        ...category,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      importedCategories += 1;
    }
  }

  if (importedProducts || importedCategories) await batch.commit();
  const settings = await getStoreSettings();
  const settingsRef = db.collection("settings").doc("store");
  const settingsSnapshot = await settingsRef.get();
  if (!settingsSnapshot.exists) await settingsRef.set({ ...settings, updatedAt: FieldValue.serverTimestamp() });

  return { importedProducts, importedCategories, settingsCreated: !settingsSnapshot.exists };
}
