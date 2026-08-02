"use client";

import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { getFirebaseAuthMessage } from "@/lib/firebase/client-error";

export function LoginClient({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const { user, hydrated, login } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && user) router.replace(nextPath);
  }, [hydrated, nextPath, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    try {
      const account = await login(String(data.get("email") ?? ""), String(data.get("password") ?? ""));
      router.replace(account.role === "admin" && nextPath === "/account" ? "/admin" : nextPath);
    } catch (caught) {
      setError(getFirebaseAuthMessage(caught));
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-page__visual">
        <Link href="/" className="auth-brand">BERKAH OYOT</Link>
        <div>
          <span>AKUN PELANGGAN</span>
          <h1>Belanja lebih singkat. Data pengiriman cukup diisi satu kali.</h1>
          <p>Profil pelanggan akan digunakan otomatis pada checkout, invoice, dan label pengiriman.</p>
        </div>
        <ul>
          <li><ShieldCheck size={18} /> Akun diamankan menggunakan Firebase Authentication.</li>
          <li><LockKeyhole size={18} /> Session login diverifikasi oleh server sebelum data diakses.</li>
        </ul>
      </div>
      <div className="auth-page__form-wrap">
        <div className="auth-form">
          <div className="auth-form__heading">
            <span className="section-kicker">Selamat datang kembali</span>
            <h2>Masuk ke akun</h2>
            <p>Gunakan email dan password yang sudah terdaftar.</p>
          </div>
          <form onSubmit={handleSubmit}>
            <label className="field-label">
              Email
              <span className="input-shell"><Mail size={18} /><input name="email" type="email" autoComplete="email" required placeholder="nama@email.com" /></span>
            </label>
            <label className="field-label">
              Password
              <span className="input-shell"><LockKeyhole size={18} /><input name="password" type="password" autoComplete="current-password" required minLength={6} placeholder="Minimal 6 karakter" /></span>
            </label>
            {error && <div className="form-error">{error}</div>}
            <button className="button button--primary full-width" disabled={submitting}>
              {submitting ? "Memeriksa akun..." : <>Masuk <ArrowRight size={18} /></>}
            </button>
          </form>
          <p className="auth-switch">Belum punya akun? <Link href={`/register?next=${encodeURIComponent(nextPath)}`}>Daftar dan isi data pengiriman</Link></p>
          <Link href="/catalog" className="auth-back">Kembali melihat katalog</Link>
        </div>
      </div>
    </section>
  );
}
