import { PaymentClient } from "./payment-client";

export default async function PaymentPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <PaymentClient orderNumber={orderNumber} />;
}
