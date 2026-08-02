import type { Metadata } from "next";
import { AdminLoginClient } from "./admin-login-client";

export const metadata: Metadata = { title: "Login Admin" };

export default function AdminLoginPage() {
  return <AdminLoginClient />;
}
