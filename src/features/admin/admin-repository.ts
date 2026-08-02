import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { toIso } from "@/lib/firebase/firestore";
import type { AdminDashboardSummary, InventoryMovement } from "@/types/commerce";
import type { CustomerAccount } from "@/types/auth";
import { listOrders } from "@/features/orders/order-repository";
import { listProducts } from "@/features/catalog/product-repository";

export async function getDashboardSummary(): Promise<AdminDashboardSummary> {
  const [orders, products, customersSnapshot] = await Promise.all([
    listOrders(),
    listProducts(),
    getAdminDb().collection("customers").get(),
  ]);

  return {
    revenue: orders.filter((order) => order.paymentStatus === "paid" || order.paymentMethod === "cod").reduce((total, order) => total + order.grandTotal, 0),
    orders: orders.length,
    pendingOrders: orders.filter((order) => order.shipmentStatus !== "delivered" && order.shipmentStatus !== "cancelled").length,
    customers: customersSnapshot.size,
    activeProducts: products.filter((product) => product.status === "active").length,
    lowStockProducts: products.filter((product) => product.status === "active" && product.stock <= (product.minimumStock ?? 5)).length,
    recentOrders: orders.slice(0, 8),
    topProducts: products.sort((a, b) => b.sold - a.sold).slice(0, 5).map((product) => ({ id: product.id, name: product.shortName, sold: product.sold, stock: product.stock })),
  };
}

export async function listCustomers(): Promise<CustomerAccount[]> {
  const snapshot = await getAdminDb().collection("customers").get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      role: "customer" as const,
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
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function adjustInventory(input: { productId: string; variantId?: string; type: "adjustment-in" | "adjustment-out" | "return"; quantity: number; reason: string }, adminUid: string): Promise<InventoryMovement> {
  const db = getAdminDb();
  const productRef = db.collection("products").doc(input.productId);
  const movementRef = db.collection("inventoryMovements").doc();

  await db.runTransaction(async (transaction) => {
    const productSnapshot = await transaction.get(productRef);
    if (!productSnapshot.exists) throw new Error("NOT_FOUND");
    const product = productSnapshot.data() ?? {};
    const variants = Array.isArray(product.variants) ? [...product.variants] as Array<Record<string, unknown>> : [];
    const delta = input.type === "adjustment-out" ? -input.quantity : input.quantity;

    let stockBefore = Number(product.stock ?? 0);
    let stockAfter = stockBefore + delta;
    let sku = String(product.sku ?? "");
    let variantName: string | undefined;

    if (variants.length) {
      if (!input.variantId) throw new Error("Pilih varian produk yang akan disesuaikan.");
      const variantIndex = variants.findIndex((variant) => String(variant.id ?? "") === input.variantId);
      if (variantIndex === -1) throw new Error("Varian produk tidak ditemukan.");
      const variant = variants[variantIndex];
      stockBefore = Number(variant.stock ?? 0);
      stockAfter = stockBefore + delta;
      if (stockAfter < 0) throw new Error("Stok varian tidak boleh menjadi negatif.");
      sku = String(variant.sku ?? product.sku ?? "");
      variantName = String(variant.name ?? "");
      variants[variantIndex] = { ...variant, stock: stockAfter };
      const activeVariants = variants.filter((item) => item.isActive !== false);
      transaction.update(productRef, {
        variants,
        stock: activeVariants.reduce((total, item) => total + Number(item.stock ?? 0), 0),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      if (stockAfter < 0) throw new Error("Stok tidak boleh menjadi negatif.");
      transaction.update(productRef, { stock: stockAfter, updatedAt: FieldValue.serverTimestamp() });
    }

    transaction.set(movementRef, {
      productId: productRef.id,
      productName: String(product.name ?? ""),
      sku,
      variantId: input.variantId ?? null,
      variantName: variantName ?? null,
      type: input.type,
      quantity: delta,
      stockBefore,
      stockAfter,
      reason: input.reason,
      createdBy: adminUid,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  const snapshot = await movementRef.get();
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    productId: String(data.productId ?? ""),
    productName: String(data.productName ?? ""),
    sku: String(data.sku ?? ""),
    variantId: data.variantId ? String(data.variantId) : undefined,
    variantName: data.variantName ? String(data.variantName) : undefined,
    type: data.type,
    quantity: Number(data.quantity ?? 0),
    stockBefore: Number(data.stockBefore ?? 0),
    stockAfter: Number(data.stockAfter ?? 0),
    reason: String(data.reason ?? ""),
    referenceId: data.referenceId ? String(data.referenceId) : undefined,
    createdBy: String(data.createdBy ?? ""),
    createdAt: toIso(data.createdAt),
  };
}

export async function listInventoryMovements(limit = 100): Promise<InventoryMovement[]> {
  const snapshot = await getAdminDb().collection("inventoryMovements").orderBy("createdAt", "desc").limit(limit).get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      productId: String(data.productId ?? ""),
      productName: String(data.productName ?? ""),
      sku: String(data.sku ?? ""),
      variantId: data.variantId ? String(data.variantId) : undefined,
      variantName: data.variantName ? String(data.variantName) : undefined,
      type: data.type,
      quantity: Number(data.quantity ?? 0),
      stockBefore: Number(data.stockBefore ?? 0),
      stockAfter: Number(data.stockAfter ?? 0),
      reason: String(data.reason ?? ""),
      referenceId: data.referenceId ? String(data.referenceId) : undefined,
      createdBy: String(data.createdBy ?? ""),
      createdAt: toIso(data.createdAt),
    };
  });
}
