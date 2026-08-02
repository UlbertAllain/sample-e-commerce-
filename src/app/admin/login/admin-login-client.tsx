"use client";

import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { getFirebaseAuthMessage } from "@/lib/firebase/client-error";

export function AdminLoginClient() {
  const router = useRouter();
  const { user, hydrated, login, logout } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && user?.role === "admin") router.replace("/admin");
  }, [hydrated, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      const account = await login(String(data.get("email") ?? ""), String(data.get("password") ?? ""));
      if (account.role !== "admin") {
        await logout();
        throw new Error("Akun ini tidak memiliki akses administrator.");
      }
      router.replace("/admin");
    } catch (caught) {
      setError(caught instanceof Error && !caught.message.startsWith("Firebase:") ? caught.message : getFirebaseAuthMessage(caught));
      setSubmitting(false);
    }
  }

  return (
    <section className="admin-login-page">
      <div className="admin-login-card">
        <Link href="/" className="admin-login-brand"><img src="/brand/logo-mark.svg" alt="" /><span>BERKAH OYOT</span></Link>
        <div className="admin-login-heading"><span>ADMINISTRATOR</span><h1>Masuk ke pusat operasi toko.</h1><p>Gunakan akun Firebase yang sudah diberikan custom claim <strong>admin</strong>.</p></div>
        <form onSubmit={handleSubmit}>
          <label>Email admin<div className="input-shell"><Mail size={18} /><input name="email" type="email" required autoComplete="email" /></div></label>
          <label>Password<div className="input-shell"><LockKeyhole size={18} /><input name="password" type="password" required autoComplete="current-password" /></div></label>
          {error && <div className="form-error">{error}</div>}
          <button className="button button--primary full-width" disabled={submitting}>{submitting ? "Memeriksa akses..." : <>Masuk Admin <ArrowRight size={18} /></>}</button>
        </form>
        <div className="admin-login-note"><ShieldCheck size={17} /><span>Session disimpan dalam cookie HTTP-only dan setiap endpoint admin memverifikasi role di server.</span></div>
      </div>
    </section>
  );
}
