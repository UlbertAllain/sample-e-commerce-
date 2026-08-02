export type ProductCategory =
  | "filter"
  | "lighting"
  | "machine"
  | "decoration"
  | "food-medicine"
  | "pipe-sparepart";

export type Product = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  category: ProductCategory;
  categoryLabel: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  wholesalePrice?: number;
  wholesaleMinimum?: number;
  stock: number;
  sku: string;
  weightGrams: number;
  image: string;
  gallery: string[];
  rating: number;
  sold: number;
  isFeatured?: boolean;
  isNew?: boolean;
  specs: Array<{ label: string; value: string }>;
};

export type CartLine = {
  productId: string;
  quantity: number;
};

export type CartDisplayLine = {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type ShippingService = {
  id: string;
  courier: string;
  service: string;
  eta: string;
  price: number;
  description: string;
};

export type CustomerAddress = {
  fullName: string;
  phone: string;
  email: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  address: string;
  note?: string;
};

export type PaymentMethod = "bank-transfer" | "qris" | "cod";
export type PaymentStatus = "pending" | "paid" | "expired";
export type ShipmentStatus =
  | "waiting-payment"
  | "processing"
  | "packed"
  | "picked-up"
  | "in-transit"
  | "delivered";

export type ShipmentTimelineItem = {
  status: ShipmentStatus;
  label: string;
  description: string;
  timestamp?: string;
  completed: boolean;
};

export type Order = {
  id: string;
  orderNumber: string;
  trackingNumber: string;
  createdAt: string;
  customer: CustomerAddress;
  items: CartDisplayLine[];
  shipping: ShippingService;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shipmentStatus: ShipmentStatus;
  subtotal: number;
  discount: number;
  shippingCost: number;
  grandTotal: number;
  voucherCode?: string;
  timeline: ShipmentTimelineItem[];
};
