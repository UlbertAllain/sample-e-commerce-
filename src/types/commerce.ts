export type ProductCategory =
  | "filter"
  | "lighting"
  | "machine"
  | "decoration"
  | "food-medicine"
  | "pipe-sparepart"
  | string;

export type ProductStatus = "draft" | "active" | "archived";

export type ProductSpec = { label: string; value: string };

export type ProductVariant = {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  wholesalePrice?: number;
  wholesaleMinimum?: number;
  stock: number;
  minimumStock?: number;
  weightGrams: number;
  isActive?: boolean;
  sold?: number;
};

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
  minimumStock?: number;
  sku: string;
  weightGrams: number;
  image: string;
  imagePublicId?: string;
  gallery: string[];
  galleryPublicIds?: string[];
  rating: number;
  sold: number;
  isFeatured?: boolean;
  isNew?: boolean;
  status?: ProductStatus;
  specs: ProductSpec[];
  variants?: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CartLine = {
  productId: string;
  variantId?: string;
  quantity: number;
};

export type CartDisplayLine = {
  product: Product;
  variant?: ProductVariant;
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
  isActive?: boolean;
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
export type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "refunded";
export type ShipmentStatus =
  | "waiting-payment"
  | "processing"
  | "packed"
  | "picked-up"
  | "in-transit"
  | "delivered"
  | "cancelled";

export type ShipmentTimelineItem = {
  status: ShipmentStatus;
  label: string;
  description: string;
  timestamp?: string;
  completed: boolean;
};

export type OrderSender = {
  storeName: string;
  phone: string;
  email: string;
  address: string;
};

export type Order = {
  id: string;
  customerId: string;
  orderNumber: string;
  trackingNumber: string;
  createdAt: string;
  updatedAt?: string;
  customer: CustomerAddress;
  sender: OrderSender;
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
  internalNote?: string;
};

export type InventoryMovementType = "sale" | "adjustment-in" | "adjustment-out" | "return" | "cancellation";

export type InventoryMovement = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  variantId?: string;
  variantName?: string;
  type: InventoryMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  referenceId?: string;
  createdBy: string;
  createdAt: string;
};

export type StoreSettings = {
  storeName: string;
  supportPhone: string;
  supportEmail: string;
  address: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  qrisImageUrl?: string;
  shippingServices: ShippingService[];
  paymentMethods: PaymentMethod[];
  updatedAt?: string;
};

export type AdminDashboardSummary = {
  revenue: number;
  orders: number;
  pendingOrders: number;
  customers: number;
  activeProducts: number;
  lowStockProducts: number;
  recentOrders: Order[];
  topProducts: Array<{ id: string; name: string; sold: number; stock: number }>;
};
