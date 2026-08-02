"use client";

import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { uploadAdminImage } from "@/lib/cloudinary/client-upload";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import type { PaymentMethod, ShippingService, StoreSettings } from "@/types/commerce";

const emptyService: ShippingService = { id: "", courier: "", service: "", eta: "", price: 0, description: "", isActive: true };

export function AdminSettingsClient() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiFetch<StoreSettings>("/api/admin/settings").then(setSettings).catch((caught) => setMessage(caught instanceof Error ? caught.message : "Pengaturan gagal dimuat."));
  }, []);

  if (!settings) return <div className="admin-loading">{message || "Memuat pengaturan..."}</div>;

  function update<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setSettings((current) => current ? { ...current, [key]: value } : current);
  }

  function updateService(index: number, key: keyof ShippingService, value: string | number | boolean) {
    setSettings((current) => {
      if (!current) return current;
      return {
        ...current,
        shippingServices: current.shippingServices.map((service, serviceIndex) =>
          serviceIndex === index ? { ...service, [key]: value } : service,
        ),
      };
    });
  }

  function togglePayment(method: PaymentMethod) {
    setSettings((current) => {
      if (!current) return current;
      const exists = current.paymentMethods.includes(method);
      const next = exists
        ? current.paymentMethods.filter((item) => item !== method)
        : [...current.paymentMethods, method];
      return next.length ? { ...current, paymentMethods: next } : current;
    });
  }

  async function uploadQris(file?: File) {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const result = await uploadAdminImage(file);
      update("qrisImageUrl", result.url);
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Upload QRIS gagal."); }
    finally { setUploading(false); }
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const updated = await apiFetch<StoreSettings>("/api/admin/settings", { method: "PATCH", body: JSON.stringify(settings) });
      setSettings(updated);
      setMessage("Pengaturan toko berhasil disimpan.");
    } catch (caught) { setMessage(caught instanceof ApiClientError ? caught.message : "Pengaturan gagal disimpan."); }
    finally { setSaving(false); }
  }

  return (
    <>
      <div className="admin-page-heading"><div><span>STORE CONFIGURATION</span><h1>Pengaturan toko</h1><p>Atur identitas toko, rekening, QRIS, kurir, dan metode pembayaran.</p></div><button className="button button--primary" onClick={save} disabled={saving || uploading}><Save size={17} /> {saving ? "Menyimpan..." : "Simpan pengaturan"}</button></div>
      {message && <div className="admin-notice">{message}</div>}
      <section className="admin-grid-two admin-grid-two--settings">
        <div className="admin-panel admin-form">
          <div className="admin-panel__heading"><div><span>IDENTITAS TOKO</span><h2>Informasi publik</h2></div></div>
          <label>Nama toko<input value={settings.storeName} onChange={(event) => update("storeName", event.target.value)} /></label>
          <label>Email dukungan<input type="email" value={settings.supportEmail} onChange={(event) => update("supportEmail", event.target.value)} /></label>
          <label>Nomor WhatsApp<input value={settings.supportPhone} onChange={(event) => update("supportPhone", event.target.value)} /></label>
          <label>Alamat toko<textarea rows={4} value={settings.address} onChange={(event) => update("address", event.target.value)} /></label>
        </div>

        <div className="admin-panel admin-form">
          <div className="admin-panel__heading"><div><span>PEMBAYARAN</span><h2>Rekening dan QRIS</h2></div></div>
          <label>Nama bank<input value={settings.bankName} onChange={(event) => update("bankName", event.target.value)} /></label>
          <label>Nomor rekening<input value={settings.bankAccountNumber} onChange={(event) => update("bankAccountNumber", event.target.value)} /></label>
          <label>Nama pemilik rekening<input value={settings.bankAccountName} onChange={(event) => update("bankAccountName", event.target.value)} /></label>
          <div className="admin-qris-upload">{settings.qrisImageUrl ? <img src={settings.qrisImageUrl} alt="QRIS toko" /> : <ImagePlus size={36} />}<label className="button button--secondary"><ImagePlus size={16} /> {uploading ? "Mengunggah..." : "Unggah QRIS"}<input type="file" accept="image/*" hidden onChange={(event) => void uploadQris(event.target.files?.[0])} /></label></div>
          <div className="admin-payment-toggles">{(["bank-transfer", "qris", "cod"] as PaymentMethod[]).map((method) => <label key={method} className="admin-check"><input type="checkbox" checked={settings.paymentMethods.includes(method)} onChange={() => togglePayment(method)} /> {method}</label>)}</div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__heading"><div><span>LAYANAN PENGIRIMAN</span><h2>Kurir dan tarif simulasi</h2></div><button className="button button--secondary" onClick={() => update("shippingServices", [...settings.shippingServices, { ...emptyService, id: `service-${Date.now()}` }])}><Plus size={16} /> Tambah layanan</button></div>
        <div className="admin-shipping-editor">
          {settings.shippingServices.map((service, index) => <article key={`${service.id}-${index}`}>
            <label>ID<input value={service.id} onChange={(event) => updateService(index, "id", event.target.value)} /></label>
            <label>Kurir<input value={service.courier} onChange={(event) => updateService(index, "courier", event.target.value)} /></label>
            <label>Layanan<input value={service.service} onChange={(event) => updateService(index, "service", event.target.value)} /></label>
            <label>Estimasi<input value={service.eta} onChange={(event) => updateService(index, "eta", event.target.value)} /></label>
            <label>Tarif<input type="number" min="0" value={service.price} onChange={(event) => updateService(index, "price", Number(event.target.value))} /></label>
            <label className="span-2">Deskripsi<input value={service.description} onChange={(event) => updateService(index, "description", event.target.value)} /></label>
            <label className="admin-check"><input type="checkbox" checked={service.isActive !== false} onChange={(event) => updateService(index, "isActive", event.target.checked)} /> Aktif</label>
            <button className="admin-icon-danger" onClick={() => update("shippingServices", settings.shippingServices.filter((_, serviceIndex) => serviceIndex !== index))} aria-label="Hapus layanan"><Trash2 size={17} /></button>
          </article>)}
        </div>
      </section>
    </>
  );
}
