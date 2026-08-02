"use client";

import { LogOut, MapPin, Package, Save, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/auth-provider";
import { apiFetch } from "@/lib/api/client";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import type { CustomerProfile } from "@/types/auth";
import type { Order } from "@/types/commerce";

export default function AccountPage() {
  const router = useRouter();
  const { user, hydrated, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hydrated && !user) router.replace("/login?next=/account");
    if (hydrated && user?.role === "admin") router.replace("/admin");
  }, [hydrated, router, user]);

  useEffect(() => {
    if (user?.role === "customer") {
      apiFetch<Order[]>("/api/store/orders").then(setOrders).catch((value) => setError(value instanceof Error ? value.message : "Riwayat pesanan gagal dimuat."));
    }
  }, [user]);

  const initials = useMemo(() => user?.profile.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(), [user]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const data = new FormData(event.currentTarget);
    const profile: CustomerProfile = {
      fullName: String(data.get("fullName") ?? ""),
      email: user.profile.email,
      phone: String(data.get("phone") ?? ""),
      province: String(data.get("province") ?? ""),
      city: String(data.get("city") ?? ""),
      district: String(data.get("district") ?? ""),
      postalCode: String(data.get("postalCode") ?? ""),
      address: String(data.get("address") ?? ""),
    };
    setSaving(true);
    setError("");
    try {
      await updateProfile(profile);
      setEditing(false);
      setMessage("Profil dan alamat utama berhasil diperbarui.");
      window.setTimeout(() => setMessage(""), 2200);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Profil gagal diperbarui.");
    } finally {
      setSaving(false);
    }
  }

  if (!hydrated || !user || user.role !== "customer") return <div className="shell loading-state">Memuat akun pelanggan...</div>;

  return (
    <section className="account-page shell section">
      <div className="account-head">
        <div className="account-identity"><span>{initials}</span><div><small>AKUN PELANGGAN</small><h1>{user.profile.fullName}</h1><p>{user.profile.email}</p></div></div>
        <button className="button button--secondary" onClick={async () => { await logout(); router.push("/"); }}><LogOut size={17} /> Keluar</button>
      </div>
      {message && <div className="success-banner">{message}</div>}
      {error && <div className="form-error">{error}</div>}
      <div className="account-layout">
        <div className="account-panel">
          <div className="panel-heading"><div><span className="section-kicker">Profil utama</span><h2>Data penerima dan alamat</h2></div><button className="text-action" onClick={() => setEditing((value) => !value)}>{editing ? "Batal" : "Ubah data"}</button></div>
          {editing ? (
            <form className="profile-form" onSubmit={handleSave}>
              <div className="form-grid">
                <label>Nama lengkap<input name="fullName" required defaultValue={user.profile.fullName} /></label>
                <label>Nomor WhatsApp<input name="phone" required defaultValue={user.profile.phone} /></label>
                <label>Provinsi<input name="province" required defaultValue={user.profile.province} /></label>
                <label>Kota / Kabupaten<input name="city" required defaultValue={user.profile.city} /></label>
                <label>Kecamatan<input name="district" required defaultValue={user.profile.district} /></label>
                <label>Kode pos<input name="postalCode" required defaultValue={user.profile.postalCode} /></label>
                <label className="span-2">Alamat lengkap<textarea name="address" required rows={4} defaultValue={user.profile.address} /></label>
              </div>
              <button className="button button--primary" disabled={saving}><Save size={17} /> {saving ? "Menyimpan..." : "Simpan perubahan"}</button>
            </form>
          ) : (
            <div className="profile-summary">
              <div><UserRound size={19} /><span><small>Penerima</small><strong>{user.profile.fullName}</strong><p>{user.profile.phone}</p></span></div>
              <div><MapPin size={19} /><span><small>Alamat utama</small><strong>{user.profile.city}, {user.profile.province}</strong><p>{user.profile.address}, {user.profile.district}, {user.profile.city}, {user.profile.province} {user.profile.postalCode}</p></span></div>
            </div>
          )}
        </div>
        <aside className="account-note"><Package size={22} /><h3>Dipakai saat checkout</h3><p>Nama, nomor WhatsApp, email, dan alamat ini otomatis disalin ke pesanan. Anda hanya perlu memilih kurir dan metode pembayaran.</p><Link href="/catalog">Mulai belanja</Link></aside>
      </div>
      <div className="orders-panel">
        <div className="panel-heading"><div><span className="section-kicker">Riwayat transaksi</span><h2>Pesanan Anda</h2></div><Link href="/tracking" className="text-action">Lacak resi</Link></div>
        {orders.length ? <div className="order-history">{orders.map((order) => <Link href={`/orders/${order.orderNumber}`} key={order.id}><div><small>{order.orderNumber}</small><strong>{formatDateTime(order.createdAt)}</strong></div><div><small>{order.items.reduce((sum, line) => sum + line.quantity, 0)} barang</small><strong>{formatCurrency(order.grandTotal)}</strong></div><span>{order.shipmentStatus.replaceAll("-", " ")}</span></Link>)}</div> : <div className="empty-inline"><p>Belum ada transaksi pada akun ini.</p><Link href="/catalog">Lihat katalog</Link></div>}
      </div>
    </section>
  );
}
