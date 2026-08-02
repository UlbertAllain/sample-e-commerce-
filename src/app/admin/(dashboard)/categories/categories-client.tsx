"use client";

import { Archive, Plus, Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import type { Category } from "@/types/commerce";

const emptyCategory: Category = { id: "", name: "", description: "", icon: "•", isActive: true, order: 0 };

async function fetchCategories() {
  return apiFetch<Category[]>("/api/admin/categories");
}

export function AdminCategoriesClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [draft, setDraft] = useState<Category>(emptyCategory);
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function reloadCategories() {
    try {
      setCategories(await fetchCategories());
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Kategori gagal dimuat.");
    }
  }

  useEffect(() => {
    let cancelled = false;

    void fetchCategories()
      .then((nextCategories) => {
        if (!cancelled) setCategories(nextCategories);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setMessage(caught instanceof Error ? caught.message : "Kategori gagal dimuat.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function edit(category: Category) {
    setEditing(category.id);
    setDraft(category);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditing(null);
    setDraft(emptyCategory);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      if (editing) {
        await apiFetch<Category>(`/api/admin/categories/${editing}`, { method: "PATCH", body: JSON.stringify(draft) });
      } else {
        await apiFetch<Category>("/api/admin/categories", { method: "POST", body: JSON.stringify(draft) });
      }
      reset();
      await reloadCategories();
      setMessage("Kategori berhasil disimpan.");
    } catch (caught) {
      setMessage(caught instanceof ApiClientError ? caught.message : "Kategori gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function archive(category: Category) {
    if (!window.confirm(`Nonaktifkan kategori ${category.name}?`)) return;
    try {
      await apiFetch<{ archived: boolean }>(`/api/admin/categories/${category.id}`, { method: "DELETE" });
      await reloadCategories();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Kategori gagal dinonaktifkan.");
    }
  }

  return (
    <>
      <div className="admin-page-heading"><div><span>STRUKTUR KATALOG</span><h1>Kategori</h1><p>Atur kelompok produk yang tampil pada filter katalog.</p></div></div>
      {message && <div className="admin-notice">{message}</div>}
      <section className="admin-grid-two admin-grid-two--form">
        <form className="admin-panel admin-form" onSubmit={submit}>
          <div className="admin-panel__heading"><div><span>{editing ? "EDIT KATEGORI" : "KATEGORI BARU"}</span><h2>{editing ? draft.name : "Tambah kategori"}</h2></div>{editing && <button type="button" onClick={reset}>Batal edit</button>}</div>
          <div className="admin-form-grid">
            <label>ID / slug<input value={draft.id} onChange={(event) => setDraft((current) => ({ ...current, id: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))} disabled={Boolean(editing)} required /></label>
            <label>Nama<input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} required /></label>
            <label>Ikon singkat<input value={draft.icon} onChange={(event) => setDraft((current) => ({ ...current, icon: event.target.value }))} maxLength={8} required /></label>
            <label>Urutan<input type="number" min="0" value={draft.order} onChange={(event) => setDraft((current) => ({ ...current, order: Number(event.target.value) }))} required /></label>
            <label className="span-2">Deskripsi<textarea rows={4} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} required /></label>
            <label className="admin-check span-2"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} /> Aktif dan tampil di katalog</label>
          </div>
          <button className="button button--primary" disabled={saving}>{editing ? <Save size={17} /> : <Plus size={17} />} {saving ? "Menyimpan..." : editing ? "Simpan perubahan" : "Tambah kategori"}</button>
        </form>

        <div className="admin-panel">
          <div className="admin-panel__heading"><div><span>DAFTAR KATEGORI</span><h2>{categories.length} kategori</h2></div></div>
          <div className="admin-category-list">
            {categories.map((category) => <article key={category.id} className={!category.isActive ? "inactive" : ""}><span className="admin-category-icon">{category.icon}</span><div><strong>{category.name}</strong><small>{category.id} · urutan {category.order}</small><p>{category.description}</p></div><div className="admin-row-actions"><button onClick={() => edit(category)}><Save size={16} /></button><button onClick={() => archive(category)}><Archive size={16} /></button></div></article>)}
          </div>
        </div>
      </section>
    </>
  );
}
