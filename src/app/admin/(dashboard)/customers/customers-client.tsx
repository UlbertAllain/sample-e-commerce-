"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { formatDateTime } from "@/lib/formatters";
import type { CustomerAccount } from "@/types/auth";

export function AdminCustomersClient() {
  const [customers, setCustomers] = useState<CustomerAccount[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<CustomerAccount[]>("/api/admin/customers").then(setCustomers).catch((caught) => setError(caught instanceof Error ? caught.message : "Pelanggan gagal dimuat.")).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return customers.filter((customer) => !normalized || `${customer.profile.fullName} ${customer.profile.email} ${customer.profile.phone} ${customer.profile.city}`.toLowerCase().includes(normalized));
  }, [customers, query]);

  return (
    <>
      <div className="admin-page-heading"><div><span>CUSTOMER DIRECTORY</span><h1>Pelanggan</h1><p>Data profil berasal dari registrasi Firebase Authentication dan dokumen pelanggan di Firestore.</p></div></div>
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-panel">
        <div className="admin-toolbar"><label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, email, WhatsApp, atau kota" /></label><span>{filtered.length} pelanggan</span></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Pelanggan</th><th>Kontak</th><th>Alamat</th><th>Terdaftar</th></tr></thead><tbody>
          {loading ? <tr><td colSpan={4}>Memuat pelanggan...</td></tr> : filtered.length ? filtered.map((customer) => <tr key={customer.id}><td><strong>{customer.profile.fullName}</strong><small>{customer.id}</small></td><td><strong>{customer.profile.email}</strong><small>{customer.profile.phone}</small></td><td>{customer.profile.address}<small>{customer.profile.district}, {customer.profile.city}, {customer.profile.province} {customer.profile.postalCode}</small></td><td>{formatDateTime(customer.createdAt)}</td></tr>) : <tr><td colSpan={4}>Belum ada pelanggan.</td></tr>}
        </tbody></table></div>
      </section>
    </>
  );
}
