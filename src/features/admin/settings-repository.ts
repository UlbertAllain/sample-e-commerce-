import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { shippingServices } from "@/data/shipping";
import { getAdminDb } from "@/lib/firebase/admin";
import { toIso } from "@/lib/firebase/firestore";
import type { PaymentMethod, StoreSettings } from "@/types/commerce";

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Berkah Oyot",
  supportPhone: "+62 882-0053-95987",
  supportEmail: "admin@berkahoyot.com",
  address: "Blimbing, Wonorejo, Polokarto, Sukoharjo, Jawa Tengah 57555",
  bankName: "BCA",
  bankAccountName: "Berkah Oyot",
  bankAccountNumber: "0000000000",
  shippingServices: shippingServices.map((item) => ({ ...item, isActive: true })),
  paymentMethods: ["bank-transfer", "qris", "cod"],
};

export async function getStoreSettings(): Promise<StoreSettings> {
  const snapshot = await getAdminDb().collection("settings").doc("store").get();
  if (!snapshot.exists) return DEFAULT_SETTINGS;
  const data = snapshot.data() ?? {};
  return {
    ...DEFAULT_SETTINGS,
    storeName: String(data.storeName ?? DEFAULT_SETTINGS.storeName),
    supportPhone: String(data.supportPhone ?? DEFAULT_SETTINGS.supportPhone),
    supportEmail: String(data.supportEmail ?? DEFAULT_SETTINGS.supportEmail),
    address: String(data.address ?? DEFAULT_SETTINGS.address),
    bankName: String(data.bankName ?? DEFAULT_SETTINGS.bankName),
    bankAccountName: String(data.bankAccountName ?? DEFAULT_SETTINGS.bankAccountName),
    bankAccountNumber: String(data.bankAccountNumber ?? DEFAULT_SETTINGS.bankAccountNumber),
    qrisImageUrl: data.qrisImageUrl ? String(data.qrisImageUrl) : undefined,
    shippingServices: Array.isArray(data.shippingServices) ? data.shippingServices : DEFAULT_SETTINGS.shippingServices,
    paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods as PaymentMethod[] : DEFAULT_SETTINGS.paymentMethods,
    updatedAt: toIso(data.updatedAt),
  };
}

export async function updateStoreSettings(input: StoreSettings): Promise<StoreSettings> {
  await getAdminDb().collection("settings").doc("store").set({ ...input, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return getStoreSettings();
}
