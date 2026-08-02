import { OrderClient } from "./order-client";

export default async function OrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <OrderClient orderNumber={orderNumber} />;
}
