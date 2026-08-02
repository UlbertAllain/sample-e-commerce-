"use client";

import { ArrowRight, Check, MapPin, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import type { CustomerRegistration } from "@/types/auth";

export function RegisterClient({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const { user, hydrated, register } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hydrated && user) router.replace(nextPath);
  }, [hydrated, nextPath, router, user]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirmation = String(data.get("passwordConfirmation") ?? "");
    if (password !== confirmation) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    const registration: CustomerRegistration = {
      fullName: String(data.get("fullName") ?? ""),
      email: String(data.get("email") ?? ""),
      phone: String(data.get("phone") ?? ""),
      province: String(data.get("province") ?? ""),
      city: String(data.get("city") ?? ""),
      district: String(data.get("district") ?? ""),
      postalCode: String(data.get("postalCode") ?? ""),
      address: String(data.get("address") ?? ""),
      password,
    };

    setSubmitting(true);
    try {
      register(registration);
      router.replace(nextPath);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pendaftaran gagal.");
      setSubmitting(false);
    }
  }

  return (
    <section className="register-page">
      <aside className="register-aside">
        <Link href="/" className="auth-brand">BERKAH OYOT</Link>
        <div>
          <span>PROFIL SEKALI, CHECKOUT LEBIH CEPAT</span>
          <h1>Alamat utama tersimpan dan dipakai otomatis saat berbelanja.</h1>
        </div>
        <ol>
          <li><b>01</b><span><strong>Buat akun</strong>Email dan password untuk masuk kembali.</span></li>
          <li><b>02</b><span><strong>Lengkapi alamat</strong>Data penerima disimpan sebagai alamat utama.</span></li>
          <li><b>03</b><span><strong>Checkout</strong>Pilih kurir dan pembayaran tanpa mengulang data diri.</span></li>
        </ol>
      </aside>
      <div className="register-main">
        <div className="register-heading">
          <span className="section-kicker">Pendaftaran pelanggan</span>
          <h2>Buat akun dan alamat utama</h2>
          <p>Semua kolom berikut diperlukan agar proses checkout dan pencetakan resi dapat langsung menggunakan profil Anda.</p>
        </div>
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-section-title"><UserRound size={19} /><div><strong>Informasi akun</strong><span>Identitas dan akses masuk</span></div></div>
          <div className="form-grid form-grid--register">
            <label>Nama lengkap<input name="fullName" required autoComplete="name" placeholder="Nama sesuai penerima paket" /></label>
            <label>Nomor WhatsApp<input name="phone" required autoComplete="tel" inputMode="tel" placeholder="08xxxxxxxxxx" /></label>
            <label className="span-2">Email<input name="email" type="email" required autoComplete="email" placeholder="nama@email.com" /></label>
            <label>Password<input name="password" type="password" required minLength={6} autoComplete="new-password" placeholder="Minimal 6 karakter" /></label>
            <label>Konfirmasi password<input name="passwordConfirmation" type="password" required minLength={6} autoComplete="new-password" placeholder="Ulangi password" /></label>
          </div>

          <div className="form-section-title"><MapPin size={19} /><div><strong>Alamat utama</strong><span>Dipakai otomatis untuk checkout dan resi</span></div></div>
          <div className="form-grid form-grid--register">
            <label>Provinsi<input name="province" required autoComplete="address-level1" placeholder="Contoh: Jawa Tengah" /></label>
            <label>Kota / Kabupaten<input name="city" required autoComplete="address-level2" placeholder="Contoh: Sukoharjo" /></label>
            <label>Kecamatan<input name="district" required autoComplete="address-level3" placeholder="Contoh: Polokarto" /></label>
            <label>Kode pos<input name="postalCode" required autoComplete="postal-code" inputMode="numeric" placeholder="57555" /></label>
            <label className="span-2">Alamat lengkap<textarea name="address" required autoComplete="street-address" rows={4} placeholder="Nama jalan, nomor rumah, RT/RW, dan patokan" /></label>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="register-submit">
            <p><Check size={16} /> Dengan mendaftar, data akun disimpan pada browser yang sedang digunakan.</p>
            <button className="button button--primary" disabled={submitting}>{submitting ? "Membuat akun..." : <>Buat akun <ArrowRight size={18} /></>}</button>
          </div>
        </form>
        <p className="auth-switch">Sudah terdaftar? <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>Masuk ke akun</Link></p>
      </div>
    </section>
  );
}
