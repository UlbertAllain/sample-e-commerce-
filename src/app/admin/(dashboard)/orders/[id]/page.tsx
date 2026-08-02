import { AdminOrderDetailClient } from "./order-detail-client";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminOrderDetailClient identifier={id} />;
}
