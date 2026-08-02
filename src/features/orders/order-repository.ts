import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getStoreSettings } from "@/features/admin/settings-repository";
import { makeVariantId } from "@/features/catalog/product-options";
import { getAdminDb } from "@/lib/firebase/admin";
import { stripUndefined, toIso } from "@/lib/firebase/firestore";
import type {
  CartDisplayLine,
  CustomerAddress,
  Order,
  PaymentMethod,
  PaymentStatus,
  Product,
  ProductVariant,
  ShipmentStatus,
  ShipmentTimelineItem,
  ShippingService,
} from "@/types/commerce";

function makeCode(prefix: string) {
  const date = new Date();
  const day = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return `${prefix}-${day}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function makeTimeline(paymentMethod: PaymentMethod): ShipmentTimelineItem[] {
  const now = new Date().toISOString();
  return [
    { status: "waiting-payment", label: "Menunggu pembayaran", description: paymentMethod === "cod" ? "Pembayaran COD dipilih." : "Pesanan dibuat dan menunggu konfirmasi pembayaran.", completed: true, timestamp: now },
    { status: "processing", label: "Pesanan diproses", description: "Tim toko menyiapkan dan memeriksa barang.", completed: paymentMethod === "cod", timestamp: paymentMethod === "cod" ? now : undefined },
    { status: "packed", label: "Pesanan dikemas", description: "Pesanan selesai dikemas dan siap diserahkan ke kurir.", completed: false },
    { status: "picked-up", label: "Diserahkan ke kurir", description: "Kurir telah menerima paket dari toko.", completed: false },
    { status: "in-transit", label: "Dalam perjalanan", description: "Paket sedang menuju alamat penerima.", completed: false },
    { status: "delivered", label: "Pesanan diterima", description: "Paket telah diterima oleh pelanggan.", completed: false },
  ];
}

function mapVariant(data: Record<string, unknown>, index: number): ProductVariant {
  return {
    id: String(data.id ?? makeVariantId(String(data.name ?? ""), index + 1)),
    name: String(data.name ?? `Varian ${index + 1}`),
    sku: String(data.sku ?? ""),
    price: Number(data.price ?? 0),
    compareAtPrice: data.compareAtPrice == null ? undefined : Number(data.compareAtPrice),
    wholesalePrice: data.wholesalePrice == null ? undefined : Number(data.wholesalePrice),
    wholesaleMinimum: data.wholesaleMinimum == null ? undefined : Number(data.wholesaleMinimum),
    stock: Number(data.stock ?? 0),
    minimumStock: Number(data.minimumStock ?? 0),
    weightGrams: Number(data.weightGrams ?? 0),
    isActive: data.isActive !== false,
    sold: Number(data.sold ?? 0),
  };
}

function snapshotProduct(id: string, data: FirebaseFirestore.DocumentData): Product {
  return {
    id,
    slug: String(data.slug ?? ""),
    name: String(data.name ?? ""),
    shortName: String(data.shortName ?? data.name ?? ""),
    category: String(data.category ?? ""),
    categoryLabel: String(data.categoryLabel ?? ""),
    description: String(data.description ?? ""),
    price: Number(data.price ?? 0),
    compareAtPrice: data.compareAtPrice == null ? undefined : Number(data.compareAtPrice),
    wholesalePrice: data.wholesalePrice == null ? undefined : Number(data.wholesalePrice),
    wholesaleMinimum: data.wholesaleMinimum == null ? undefined : Number(data.wholesaleMinimum),
    stock: Number(data.stock ?? 0),
    minimumStock: Number(data.minimumStock ?? 5),
    sku: String(data.sku ?? ""),
    weightGrams: Number(data.weightGrams ?? 0),
    image: String(data.image ?? ""),
    gallery: Array.isArray(data.gallery) ? data.gallery.map(String) : [],
    rating: Number(data.rating ?? 0),
    sold: Number(data.sold ?? 0),
    specs: Array.isArray(data.specs) ? data.specs : [],
    variants: Array.isArray(data.variants) ? data.variants.map((variant: Record<string, unknown>, index: number) => mapVariant(variant, index)) : [],
    status: "active",
  };
}

function mapOrder(id: string, data: FirebaseFirestore.DocumentData): Order {
  return {
    id,
    customerId: String(data.customerId ?? ""),
    orderNumber: String(data.orderNumber ?? ""),
    trackingNumber: String(data.trackingNumber ?? ""),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
    customer: data.customer as CustomerAddress,
    sender: data.sender && typeof data.sender === "object" ? {
      storeName: String(data.sender.storeName ?? "Berkah Oyot"),
      phone: String(data.sender.phone ?? "+62 882-0053-95987"),
      email: String(data.sender.email ?? "admin@berkahoyot.com"),
      address: String(data.sender.address ?? "Blimbing, Wonorejo, Polokarto, Sukoharjo 57555"),
    } : {
      storeName: "Berkah Oyot",
      phone: "+62 882-0053-95987",
      email: "admin@berkahoyot.com",
      address: "Blimbing, Wonorejo, Polokarto, Sukoharjo 57555",
    },
    items: Array.isArray(data.items) ? data.items as CartDisplayLine[] : [],
    shipping: data.shipping as ShippingService,
    paymentMethod: data.paymentMethod as PaymentMethod,
    paymentStatus: data.paymentStatus as PaymentStatus,
    shipmentStatus: data.shipmentStatus as ShipmentStatus,
    subtotal: Number(data.subtotal ?? 0),
    discount: Number(data.discount ?? 0),
    shippingCost: Number(data.shippingCost ?? 0),
    grandTotal: Number(data.grandTotal ?? 0),
    voucherCode: data.voucherCode ? String(data.voucherCode) : undefined,
    timeline: Array.isArray(data.timeline) ? data.timeline : [],
    internalNote: data.internalNote ? String(data.internalNote) : undefined,
  };
}

export async function createOrder(input: {
  customerId: string;
  items: Array<{ productId: string; variantId?: string; quantity: number }>;
  shippingId: string;
  paymentMethod: PaymentMethod;
  voucherCode?: string;
  note?: string;
}): Promise<Order> {
  const db = getAdminDb();
  const settings = await getStoreSettings();
  const shipping = settings.shippingServices.find((item) => item.id === input.shippingId && item.isActive !== false);
  if (!shipping) throw new Error("Layanan pengiriman tidak tersedia.");
  if (!settings.paymentMethods.includes(input.paymentMethod)) throw new Error("Metode pembayaran tidak tersedia.");

  const itemMap = new Map<string, { productId: string; variantId?: string; quantity: number }>();
  for (const item of input.items) {
    const key = `${item.productId}:${item.variantId ?? ""}`;
    const current = itemMap.get(key);
    itemMap.set(key, { productId: item.productId, variantId: item.variantId, quantity: (current?.quantity ?? 0) + item.quantity });
  }
  const items = Array.from(itemMap.values());
  if (items.some((item) => item.quantity > 999)) throw new Error("Jumlah salah satu produk melebihi batas transaksi.");

  const customerSnapshot = await db.collection("customers").doc(input.customerId).get();
  if (!customerSnapshot.exists) throw new Error("Profil pelanggan belum lengkap.");
  const customerData = customerSnapshot.data() ?? {};
  const customer: CustomerAddress = {
    fullName: String(customerData.fullName ?? ""),
    email: String(customerData.email ?? ""),
    phone: String(customerData.phone ?? ""),
    province: String(customerData.province ?? ""),
    city: String(customerData.city ?? ""),
    district: String(customerData.district ?? ""),
    postalCode: String(customerData.postalCode ?? ""),
    address: String(customerData.address ?? ""),
    note: input.note,
  };

  const orderRef = db.collection("orders").doc();
  const orderNumber = makeCode("BO");
  const trackingNumber = makeCode("RESI");

  await db.runTransaction(async (transaction) => {
    const grouped = new Map<string, typeof items>();
    for (const item of items) grouped.set(item.productId, [...(grouped.get(item.productId) ?? []), item]);
    const productIds = Array.from(grouped.keys());
    const productRefs = productIds.map((productId) => db.collection("products").doc(productId));
    const productSnapshots = await Promise.all(productRefs.map((ref) => transaction.get(ref)));
    const displayLines: CartDisplayLine[] = [];

    productSnapshots.forEach((snapshot, productIndex) => {
      if (!snapshot.exists) throw new Error("Salah satu produk tidak ditemukan.");
      const data = snapshot.data() ?? {};
      if (data.status !== "active") throw new Error(`${String(data.name ?? "Produk")} sedang tidak tersedia.`);

      const product = snapshotProduct(snapshot.id, data);
      const productItems = grouped.get(snapshot.id) ?? [];
      const variants = [...(product.variants ?? [])];
      const activeVariants = variants.filter((variant) => variant.isActive !== false);
      let baseStock = product.stock;
      let baseSold = product.sold;

      productItems.forEach((item) => {
        let variant: ProductVariant | undefined;
        let stockBefore: number;
        let sku = product.sku;

        if (activeVariants.length) {
          variant = activeVariants.find((entry) => entry.id === item.variantId) ?? (!item.variantId ? activeVariants[0] : undefined);
          if (!variant) throw new Error(`Varian ${product.name} tidak ditemukan atau tidak aktif.`);
          stockBefore = variant.stock;
          sku = variant.sku;
        } else {
          stockBefore = baseStock;
        }

        if (stockBefore < item.quantity) throw new Error(`Stok ${product.name}${variant ? ` (${variant.name})` : ""} tidak mencukupi.`);
        const wholesalePrice = variant?.wholesalePrice ?? product.wholesalePrice;
        const wholesaleMinimum = variant?.wholesaleMinimum ?? product.wholesaleMinimum;
        const normalPrice = variant?.price ?? product.price;
        const unitPrice = wholesalePrice != null && wholesaleMinimum != null && item.quantity >= wholesaleMinimum ? wholesalePrice : normalPrice;
        displayLines.push({ product, variant, quantity: item.quantity, unitPrice, subtotal: unitPrice * item.quantity });

        if (variant) {
          const variantIndex = variants.findIndex((entry) => entry.id === variant?.id);
          variants[variantIndex] = { ...variants[variantIndex], stock: stockBefore - item.quantity, sold: (variant.sold ?? 0) + item.quantity };
        } else {
          baseStock -= item.quantity;
          baseSold += item.quantity;
        }

        transaction.set(db.collection("inventoryMovements").doc(), stripUndefined({
          productId: snapshot.id,
          productName: product.name,
          sku,
          variantId: variant?.id,
          variantName: variant?.name,
          type: "sale",
          quantity: -item.quantity,
          stockBefore,
          stockAfter: stockBefore - item.quantity,
          reason: `Reservasi stok untuk pesanan ${orderNumber}`,
          referenceId: orderRef.id,
          createdBy: input.customerId,
          createdAt: FieldValue.serverTimestamp(),
        }));
      });

      if (activeVariants.length) {
        const activeUpdated = variants.filter((variant) => variant.isActive !== false);
        transaction.update(productRefs[productIndex], {
          variants,
          stock: activeUpdated.reduce((total, variant) => total + variant.stock, 0),
          sold: activeUpdated.reduce((total, variant) => total + (variant.sold ?? 0), 0),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        transaction.update(productRefs[productIndex], { stock: baseStock, sold: baseSold, updatedAt: FieldValue.serverTimestamp() });
      }
    });

    const subtotal = displayLines.reduce((total, line) => total + line.subtotal, 0);
    const voucher = input.voucherCode?.trim().toUpperCase();
    const discount = voucher === "AQUA10" ? Math.min(Math.round(subtotal * 0.1), 25000) : 0;
    const now = FieldValue.serverTimestamp();
    transaction.set(orderRef, stripUndefined({
      customerId: input.customerId,
      orderNumber,
      trackingNumber,
      customer,
      sender: {
        storeName: settings.storeName,
        phone: settings.supportPhone,
        email: settings.supportEmail,
        address: settings.address,
      },
      items: displayLines,
      shipping,
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      shipmentStatus: input.paymentMethod === "cod" ? "processing" : "waiting-payment",
      subtotal,
      discount,
      shippingCost: shipping.price,
      grandTotal: subtotal - discount + shipping.price,
      voucherCode: voucher,
      timeline: makeTimeline(input.paymentMethod),
      stockRestored: false,
      createdAt: now,
      updatedAt: now,
    }));
  });

  const created = await orderRef.get();
  return mapOrder(created.id, created.data() ?? {});
}

export async function getOrderByIdentifier(identifier: string, viewer?: { uid: string; role: "customer" | "admin" }): Promise<Order | null> {
  const db = getAdminDb();
  let snapshot = await db.collection("orders").where("orderNumber", "==", identifier).limit(1).get();
  if (snapshot.empty) snapshot = await db.collection("orders").where("trackingNumber", "==", identifier).limit(1).get();
  const doc = snapshot.docs[0];
  if (!doc) return null;
  const order = mapOrder(doc.id, doc.data());
  if (viewer && viewer.role !== "admin" && order.customerId !== viewer.uid) throw new Error("FORBIDDEN");
  return order;
}

export async function listOrders(options?: { customerId?: string }): Promise<Order[]> {
  let query: FirebaseFirestore.Query = getAdminDb().collection("orders");
  if (options?.customerId) query = query.where("customerId", "==", options.customerId);
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => mapOrder(doc.id, doc.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markOrderPaid(identifier: string, customerId?: string): Promise<Order> {
  const order = await getOrderByIdentifier(identifier);
  if (!order) throw new Error("NOT_FOUND");
  if (customerId && order.customerId !== customerId) throw new Error("FORBIDDEN");
  if (order.shipmentStatus === "cancelled") throw new Error("Pesanan yang dibatalkan tidak dapat dibayar.");
  if (order.paymentStatus === "paid") return order;
  const ref = getAdminDb().collection("orders").doc(order.id);
  const timestamp = new Date().toISOString();
  const timeline = order.timeline.map((item) => item.status === "processing" ? { ...item, completed: true, timestamp } : item);
  await ref.update({ paymentStatus: "paid", shipmentStatus: "processing", timeline, updatedAt: FieldValue.serverTimestamp() });
  const updated = await ref.get();
  return mapOrder(updated.id, updated.data() ?? {});
}

export async function updateOrder(identifier: string, input: { paymentStatus?: PaymentStatus; shipmentStatus?: ShipmentStatus; trackingNumber?: string; internalNote?: string }, adminUid: string): Promise<Order> {
  const db = getAdminDb();
  const current = await getOrderByIdentifier(identifier);
  if (!current) throw new Error("NOT_FOUND");
  const ref = db.collection("orders").doc(current.id);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data() ?? {};
    const updates: Record<string, unknown> = { ...input, updatedAt: FieldValue.serverTimestamp() };
    const nextShipment = input.shipmentStatus;

    if (nextShipment) {
      const now = new Date().toISOString();
      const progression: ShipmentStatus[] = ["waiting-payment", "processing", "packed", "picked-up", "in-transit", "delivered"];
      const nextIndex = progression.indexOf(nextShipment);
      let timeline = (Array.isArray(data.timeline) ? data.timeline : []).map((item: ShipmentTimelineItem) => {
        const itemIndex = progression.indexOf(item.status);
        if (nextIndex >= 0 && itemIndex >= 0 && itemIndex <= nextIndex) return { ...item, completed: true, timestamp: item.timestamp || now };
        return item;
      });
      if (nextShipment === "cancelled" && !timeline.some((item: ShipmentTimelineItem) => item.status === "cancelled")) {
        timeline = [...timeline, { status: "cancelled", label: "Pesanan dibatalkan", description: "Pesanan dibatalkan oleh administrator.", completed: true, timestamp: now }];
      }
      updates.timeline = timeline;
    }

    if (nextShipment === "cancelled" && !data.stockRestored) {
      const items = Array.isArray(data.items) ? data.items as CartDisplayLine[] : [];
      const grouped = new Map<string, CartDisplayLine[]>();
      for (const item of items) grouped.set(item.product.id, [...(grouped.get(item.product.id) ?? []), item]);
      const productIds = Array.from(grouped.keys());
      const productRefs = productIds.map((productId) => db.collection("products").doc(productId));
      const productSnapshots = await Promise.all(productRefs.map((productRef) => transaction.get(productRef)));

      productSnapshots.forEach((productSnapshot, productIndex) => {
        if (!productSnapshot.exists) return;
        const productData = productSnapshot.data() ?? {};
        const product = snapshotProduct(productSnapshot.id, productData);
        const productItems = grouped.get(productSnapshot.id) ?? [];
        const variants = [...(product.variants ?? [])];
        const hasVariants = variants.length > 0;
        let baseStock = product.stock;
        let baseSold = product.sold;

        productItems.forEach((item) => {
          const variantId = item.variant?.id;
          const variantIndex = variantId
            ? variants.findIndex((variant) => variant.id === variantId)
            : hasVariants
              ? variants.findIndex((variant) => variant.isActive !== false)
              : -1;
          const variant = variantIndex >= 0 ? variants[variantIndex] : undefined;
          const stockBefore = variant?.stock ?? baseStock;
          const soldBefore = variant?.sold ?? baseSold;

          if (variant && variantIndex >= 0) {
            variants[variantIndex] = { ...variant, stock: stockBefore + item.quantity, sold: Math.max(0, soldBefore - item.quantity), isActive: true };
          } else {
            baseStock += item.quantity;
            baseSold = Math.max(0, baseSold - item.quantity);
          }

          transaction.set(db.collection("inventoryMovements").doc(), stripUndefined({
            productId: item.product.id,
            productName: item.product.name,
            sku: variant?.sku ?? item.product.sku,
            variantId: variant?.id,
            variantName: variant?.name,
            type: "cancellation",
            quantity: item.quantity,
            stockBefore,
            stockAfter: stockBefore + item.quantity,
            reason: `Pengembalian stok karena pesanan ${current.orderNumber} dibatalkan`,
            referenceId: current.id,
            createdBy: adminUid,
            createdAt: FieldValue.serverTimestamp(),
          }));
        });

        if (hasVariants) {
          const active = variants.filter((variant) => variant.isActive !== false);
          transaction.update(productRefs[productIndex], {
            variants,
            stock: active.reduce((total, variant) => total + variant.stock, 0),
            sold: active.reduce((total, variant) => total + (variant.sold ?? 0), 0),
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else {
          transaction.update(productRefs[productIndex], { stock: baseStock, sold: baseSold, updatedAt: FieldValue.serverTimestamp() });
        }
      });
      updates.stockRestored = true;
    }

    transaction.update(ref, stripUndefined(updates));
  });

  const updated = await ref.get();
  return mapOrder(updated.id, updated.data() ?? {});
}
