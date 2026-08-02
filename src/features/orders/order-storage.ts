import { demoOrder } from "@/data/demo-order";
import type {
  CartDisplayLine,
  CustomerAddress,
  Order,
  PaymentMethod,
  ShipmentStatus,
  ShippingService,
  ShipmentTimelineItem,
} from "@/types/commerce";

const ORDERS_KEY = "berkah-oyot:orders";

function readOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: Order[]) {
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function makeCode(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 900 + 100)}`;
}

function makeTimeline(): ShipmentTimelineItem[] {
  return [
    {
      status: "waiting-payment",
      label: "Menunggu pembayaran",
      description: "Pesanan dibuat dan menunggu konfirmasi pembayaran.",
      completed: true,
      timestamp: new Date().toISOString(),
    },
    {
      status: "processing",
      label: "Pesanan diproses",
      description: "Tim toko menyiapkan dan memeriksa barang.",
      completed: false,
    },
    {
      status: "packed",
      label: "Pesanan dikemas",
      description: "Pesanan selesai dikemas dan siap diserahkan ke kurir.",
      completed: false,
    },
    {
      status: "picked-up",
      label: "Diserahkan ke kurir",
      description: "Kurir telah menerima paket dari toko.",
      completed: false,
    },
    {
      status: "in-transit",
      label: "Dalam perjalanan",
      description: "Paket sedang menuju alamat penerima.",
      completed: false,
    },
    {
      status: "delivered",
      label: "Pesanan diterima",
      description: "Paket telah diterima oleh pelanggan.",
      completed: false,
    },
  ];
}

export function createOrder(input: {
  customer: CustomerAddress;
  items: CartDisplayLine[];
  shipping: ShippingService;
  paymentMethod: PaymentMethod;
  voucherCode?: string;
  discount: number;
}): Order {
  const subtotal = input.items.reduce((total, item) => total + item.subtotal, 0);
  const order: Order = {
    id: crypto.randomUUID(),
    orderNumber: makeCode("BO"),
    trackingNumber: makeCode("RESI"),
    createdAt: new Date().toISOString(),
    customer: input.customer,
    items: input.items,
    shipping: input.shipping,
    paymentMethod: input.paymentMethod,
    paymentStatus: "pending",
    shipmentStatus: input.paymentMethod === "cod" ? "processing" : "waiting-payment",
    subtotal,
    discount: input.discount,
    shippingCost: input.shipping.price,
    grandTotal: subtotal - input.discount + input.shipping.price,
    voucherCode: input.voucherCode,
    timeline: makeTimeline(),
  };

  if (input.paymentMethod === "cod") {
    order.timeline[1] = {
      ...order.timeline[1],
      completed: true,
      timestamp: new Date().toISOString(),
      description: "Pembayaran COD dipilih. Pesanan langsung diproses.",
    };
  }

  writeOrders([order, ...readOrders()]);
  return order;
}

export function getOrder(identifier: string): Order | null {
  const localOrder = readOrders().find(
    (order) => order.orderNumber === identifier || order.trackingNumber === identifier,
  );
  if (localOrder) return localOrder;
  if (demoOrder.orderNumber === identifier || demoOrder.trackingNumber === identifier) return demoOrder;
  return null;
}

export function markOrderPaid(orderNumber: string): Order | null {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.orderNumber === orderNumber);
  if (index < 0) return null;

  const order = orders[index];
  const timestamp = new Date().toISOString();
  order.paymentStatus = "paid";
  order.shipmentStatus = "processing";
  order.timeline = order.timeline.map((item) =>
    item.status === "processing"
      ? { ...item, completed: true, timestamp }
      : item,
  );
  orders[index] = order;
  writeOrders(orders);
  return order;
}

const shipmentFlow: ShipmentStatus[] = [
  "processing",
  "packed",
  "picked-up",
  "in-transit",
  "delivered",
];

export function advanceShipment(orderNumber: string): Order | null {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.orderNumber === orderNumber);
  if (index < 0) return null;

  const order = orders[index];
  if (order.paymentStatus !== "paid" && order.paymentMethod !== "cod") return order;
  const currentIndex = shipmentFlow.indexOf(order.shipmentStatus);
  const next = shipmentFlow[Math.min(currentIndex + 1, shipmentFlow.length - 1)];
  order.shipmentStatus = next;
  order.timeline = order.timeline.map((item) =>
    item.status === next
      ? { ...item, completed: true, timestamp: new Date().toISOString() }
      : item,
  );
  orders[index] = order;
  writeOrders(orders);
  return order;
}

export function getOrdersByCustomerEmail(email: string): Order[] {
  const normalized = email.trim().toLowerCase();
  return readOrders()
    .filter((order) => order.customer.email.trim().toLowerCase() === normalized)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
