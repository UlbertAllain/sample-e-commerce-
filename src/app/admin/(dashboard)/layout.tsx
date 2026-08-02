import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return <AdminShell admin={{ name: admin.name, email: admin.email }}>{children}</AdminShell>;
}
