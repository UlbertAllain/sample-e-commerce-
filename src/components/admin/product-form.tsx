"use client";

import { ImagePlus, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { makeProductSkuPreview, makeVariantId, makeVariantSkuPreview } from "@/features/catalog/product-options";
import { uploadAdminImage } from "@/lib/cloudinary/client-upload";
import { ApiClientError, apiFetch } from "@/lib/api/client";
import type { Category, Product, ProductStatus, ProductVariant } from "@/types/commerce";

type ProductFormProps = { initialProduct?: Product };

type VariantDraft = {
  id: string;
  name: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  wholesalePrice: string;
  wholesaleMinimum: string;
  stock: string;
  minimumStock: string;
  weightGrams: string;
  isActive: boolean;
  sold: string;
  persisted: boolean;
};

type ProductDraft = {
  name: string;
  shortName: string;
  slug: string;
  category: string;
  description: string;
  price: string;
  compareAtPrice: string;
  wholesalePrice: string;
  wholesaleMinimum: string;
  stock: string;
  minimumStock: string;
  sku: string;
  weightGrams: string;
  image: string;
  imagePublicId: string;
  gallery: string[];
  galleryPublicIds: string[];
  rating: string;
  sold: string;
  status: ProductStatus;
  isFeatured: boolean;
  isNew: boolean;
  specsText: string;
  hasVariants: boolean;
  variants: VariantDraft[];
};

function makeSlug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function digitsOnly(value: string) {
  return value.replace(/\D+/g, "");
}

function decimalOnly(value: string) {
  const normalized = value.replace(/[^0-9.]+/g, "");
  const [whole, ...fractions] = normalized.split(".");
  return fractions.length ? `${whole}.${fractions.join("")}` : whole;
}

function toVariantDraft(variant: ProductVariant): VariantDraft {
  return {
    id: variant.id,
    name: variant.name,
    sku: variant.sku,
    price: String(variant.price),
    compareAtPrice: variant.compareAtPrice == null ? "" : String(variant.compareAtPrice),
    wholesalePrice: variant.wholesalePrice == null ? "" : String(variant.wholesalePrice),
    wholesaleMinimum: variant.wholesaleMinimum == null ? "" : String(variant.wholesaleMinimum),
    stock: String(variant.stock),
    minimumStock: String(variant.minimumStock ?? 0),
    weightGrams: String(variant.weightGrams),
    isActive: variant.isActive !== false,
    sold: String(variant.sold ?? 0),
    persisted: true,
  };
}

function toDraft(product?: Product): ProductDraft {
  const variants = (product?.variants ?? []).map(toVariantDraft);
  return {
    name: product?.name ?? "",
    shortName: product?.shortName ?? "",
    slug: product?.slug ?? "",
    category: product?.category ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    compareAtPrice: product?.compareAtPrice == null ? "" : String(product.compareAtPrice),
    wholesalePrice: product?.wholesalePrice == null ? "" : String(product.wholesalePrice),
    wholesaleMinimum: product?.wholesaleMinimum == null ? "" : String(product.wholesaleMinimum),
    stock: product ? String(product.stock) : "0",
    minimumStock: String(product?.minimumStock ?? 5),
    sku: product?.sku ?? "",
    weightGrams: product ? String(product.weightGrams) : "",
    image: product?.image ?? "",
    imagePublicId: product?.imagePublicId ?? "",
    gallery: product?.gallery?.length ? product.gallery : [],
    galleryPublicIds: product?.galleryPublicIds ?? [],
    rating: String(product?.rating ?? 0),
    sold: String(product?.sold ?? 0),
    status: product?.status ?? "active",
    isFeatured: Boolean(product?.isFeatured),
    isNew: Boolean(product?.isNew),
    specsText: product?.specs.map((spec) => `${spec.label}: ${spec.value}`).join("\n") ?? "",
    hasVariants: variants.length > 0,
    variants,
  };
}

function emptyVariant(index: number, seed?: Partial<VariantDraft>): VariantDraft {
  return {
    id: `varian-${index}`,
    name: "",
    sku: "",
    price: "",
    compareAtPrice: "",
    wholesalePrice: "",
    wholesaleMinimum: "",
    stock: "0",
    minimumStock: "0",
    weightGrams: "",
    isActive: true,
    sold: "0",
    persisted: false,
    ...seed,
  };
}

export function ProductForm({ initialProduct }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [draft, setDraft] = useState<ProductDraft>(() => toDraft(initialProduct));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Category[]>("/api/admin/categories").then((items) => {
      setCategories(items);
      setDraft((current) => !current.category && items[0] ? { ...current, category: items[0].id } : current);
    }).catch((caught) => setError(caught instanceof Error ? caught.message : "Kategori gagal dimuat."));
  }, []);

  const selectedCategory = useMemo(() => categories.find((item) => item.id === draft.category), [categories, draft.category]);
  const skuPreview = draft.sku || makeProductSkuPreview(draft.category, draft.name);

  function update<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleName(value: string) {
    setDraft((current) => ({
      ...current,
      name: value,
      shortName: current.shortName || value.slice(0, 80),
      slug: initialProduct ? current.slug : makeSlug(value),
    }));
  }

  function toggleVariants(enabled: boolean) {
    if (!enabled && draft.variants.some((variant) => variant.persisted && Number(variant.stock) > 0)) {
      window.alert("Masih ada stok pada varian. Kosongkan seluruh stok varian melalui menu Inventori sebelum mematikan percabangan.");
      return;
    }
    if (!enabled && draft.variants.length > 0 && !window.confirm("Mematikan varian akan menghapus seluruh percabangan produk dari form. Lanjutkan?")) return;
    setDraft((current) => ({
      ...current,
      hasVariants: enabled,
      variants: enabled ? (current.variants.length ? current.variants : [emptyVariant(1, {
        price: current.price,
        compareAtPrice: current.compareAtPrice,
        wholesalePrice: current.wholesalePrice,
        wholesaleMinimum: current.wholesaleMinimum,
        stock: current.stock,
        minimumStock: current.minimumStock,
        weightGrams: current.weightGrams,
        sold: current.sold,
      })]) : [],
    }));
  }

  function addVariant() {
    setDraft((current) => ({ ...current, variants: [...current.variants, emptyVariant(current.variants.length + 1)] }));
  }

  function updateVariant<K extends keyof VariantDraft>(index: number, key: K, value: VariantDraft[K]) {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) => {
        if (variantIndex !== index) return variant;
        if (key === "name") {
          const name = String(value);
          return {
            ...variant,
            name,
            id: variant.persisted ? variant.id : makeVariantId(name, index + 1),
          };
        }
        if (key === "isActive" && value === false && variant.persisted && Number(variant.stock) > 0) {
          window.alert("Varian masih memiliki stok. Kosongkan stok melalui menu Inventori sebelum menonaktifkannya.");
          return variant;
        }
        return { ...variant, [key]: value };
      }),
    }));
  }

  function removeVariant(index: number) {
    const variant = draft.variants[index];
    if (variant?.persisted) {
      if (Number(variant.stock) > 0) {
        window.alert("Stok varian masih tersedia. Kosongkan melalui menu Inventori sebelum menonaktifkan varian.");
        return;
      }
      setDraft((current) => ({
        ...current,
        variants: current.variants.map((item, variantIndex) => variantIndex === index ? { ...item, isActive: false } : item),
      }));
      return;
    }
    setDraft((current) => ({ ...current, variants: current.variants.filter((_, variantIndex) => variantIndex !== index) }));
  }

  async function uploadMain(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await uploadAdminImage(file);
      setDraft((current) => ({
        ...current,
        image: result.url,
        imagePublicId: result.publicId,
        gallery: current.gallery.length ? current.gallery : [result.url],
        galleryPublicIds: current.galleryPublicIds.length ? current.galleryPublicIds : [result.publicId],
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload gambar gagal.");
    } finally {
      setUploading(false);
    }
  }

  async function uploadGallery(files?: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      const available = Math.max(0, 10 - draft.gallery.length);
      const selected = Array.from(files).slice(0, available);
      const uploaded = await Promise.all(selected.map(uploadAdminImage));
      setDraft((current) => ({
        ...current,
        gallery: [...current.gallery, ...uploaded.map((item) => item.url)].slice(0, 10),
        galleryPublicIds: [...current.galleryPublicIds, ...uploaded.map((item) => item.publicId)].slice(0, 10),
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload galeri gagal.");
    } finally {
      setUploading(false);
    }
  }

  function removeGallery(index: number) {
    setDraft((current) => ({
      ...current,
      gallery: current.gallery.filter((_, itemIndex) => itemIndex !== index),
      galleryPublicIds: current.galleryPublicIds.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const specs = draft.specsText.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const separator = line.indexOf(":");
      return separator === -1 ? { label: "Informasi", value: line } : { label: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim() };
    }).filter((spec) => spec.label && spec.value);

    const activeVariants = draft.variants.filter((variant) => variant.isActive);
    const inactiveWithStock = draft.variants.find((variant) => !variant.isActive && Number(variant.stock) > 0);
    if (inactiveWithStock) {
      setError(`Varian ${inactiveWithStock.name || "tanpa nama"} masih memiliki stok dan tidak dapat dinonaktifkan.`);
      setSaving(false);
      return;
    }
    if (draft.hasVariants && !activeVariants.length) {
      setError("Tambahkan minimal satu varian aktif.");
      setSaving(false);
      return;
    }

    const variants = draft.hasVariants ? draft.variants.map((variant, index) => ({
      id: variant.id || makeVariantId(variant.name, index + 1),
      name: variant.name,
      sku: variant.persisted ? variant.sku : "",
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      wholesalePrice: variant.wholesalePrice,
      wholesaleMinimum: variant.wholesaleMinimum,
      stock: variant.stock,
      minimumStock: variant.minimumStock,
      weightGrams: variant.weightGrams,
      isActive: variant.isActive,
      sold: variant.sold,
    })) : [];

    const variantPrices = activeVariants.map((variant) => Number(variant.price || 0)).filter((value) => value > 0);
    const variantStocks = activeVariants.reduce((total, variant) => total + Number(variant.stock || 0), 0);
    const variantMinimumStocks = activeVariants.reduce((total, variant) => total + Number(variant.minimumStock || 0), 0);
    const variantWeights = activeVariants.map((variant) => Number(variant.weightGrams || 0)).filter((value) => value > 0);

    if (draft.hasVariants && (variantPrices.length !== activeVariants.length || variantWeights.length !== activeVariants.length)) {
      setError("Harga jual dan berat wajib diisi pada setiap varian aktif.");
      setSaving(false);
      return;
    }

    const body = {
      slug: draft.slug,
      name: draft.name,
      shortName: draft.shortName,
      category: draft.category,
      categoryLabel: selectedCategory?.name ?? draft.category,
      description: draft.description,
      price: draft.hasVariants ? String(Math.min(...variantPrices)) : draft.price,
      compareAtPrice: draft.hasVariants ? "" : draft.compareAtPrice,
      wholesalePrice: draft.hasVariants ? "" : draft.wholesalePrice,
      wholesaleMinimum: draft.hasVariants ? "" : draft.wholesaleMinimum,
      stock: draft.hasVariants ? String(variantStocks) : draft.stock,
      minimumStock: draft.hasVariants ? String(variantMinimumStocks) : draft.minimumStock,
      sku: initialProduct ? draft.sku : "",
      weightGrams: draft.hasVariants ? String(Math.min(...variantWeights)) : draft.weightGrams,
      image: draft.image,
      imagePublicId: draft.imagePublicId || undefined,
      gallery: draft.gallery.length ? draft.gallery : [draft.image],
      galleryPublicIds: draft.galleryPublicIds,
      rating: draft.rating,
      sold: draft.sold,
      status: draft.status,
      isFeatured: draft.isFeatured,
      isNew: draft.isNew,
      specs,
      variants,
    };

    try {
      if (initialProduct) {
        await apiFetch<Product>(`/api/admin/products/${initialProduct.id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        await apiFetch<Product>("/api/admin/products", { method: "POST", body: JSON.stringify(body) });
      }
      router.push("/admin/products");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Produk gagal disimpan.");
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <section className="admin-panel">
        <div className="admin-panel__heading"><div><span>INFORMASI PRODUK</span><h2>Identitas dan katalog</h2></div></div>
        <div className="admin-form-grid">
          <label className="span-2">Nama produk<input value={draft.name} onChange={(event) => handleName(event.target.value)} required /></label>
          <label>Nama singkat<input value={draft.shortName} onChange={(event) => update("shortName", event.target.value)} required /></label>
          <label>Slug<input value={draft.slug} onChange={(event) => update("slug", makeSlug(event.target.value))} required /></label>
          <label>Kategori<select value={draft.category} onChange={(event) => update("category", event.target.value)} required>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label>SKU otomatis<input value={skuPreview} readOnly aria-readonly="true" /><small>SKU dibuat otomatis dan dijaga tetap unik oleh server.</small></label>
          <label>Status<select value={draft.status} onChange={(event) => update("status", event.target.value as ProductStatus)}><option value="active">Aktif</option><option value="draft">Draft</option><option value="archived">Arsip</option></select></label>
          <label className="span-2">Deskripsi<textarea rows={6} value={draft.description} onChange={(event) => update("description", event.target.value)} required /></label>
          <label className="admin-check"><input type="checkbox" checked={draft.isFeatured} onChange={(event) => update("isFeatured", event.target.checked)} /> Produk unggulan</label>
          <label className="admin-check"><input type="checkbox" checked={draft.isNew} onChange={(event) => update("isNew", event.target.checked)} /> Tandai produk baru</label>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__heading"><div><span>TIPE PRODUK</span><h2>Produk tunggal atau bercabang</h2></div></div>
        <label className="admin-variant-toggle">
          <input type="checkbox" checked={draft.hasVariants} onChange={(event) => toggleVariants(event.target.checked)} />
          <span><strong>Produk memiliki varian</strong><small>Aktifkan untuk ukuran, kapasitas, warna, model, atau jenis lain. Matikan jika produk hanya memiliki satu pilihan.</small></span>
        </label>
      </section>

      {!draft.hasVariants ? (
        <section className="admin-panel">
          <div className="admin-panel__heading"><div><span>HARGA DAN STOK</span><h2>Nilai jual dan inventori</h2></div></div>
          <div className="admin-form-grid admin-form-grid--four">
            <label>Harga jual<input type="text" inputMode="numeric" value={draft.price} onChange={(event) => update("price", digitsOnly(event.target.value))} required /></label>
            <label>Harga coret<input type="text" inputMode="numeric" value={draft.compareAtPrice} onChange={(event) => update("compareAtPrice", digitsOnly(event.target.value))} /></label>
            <label>Harga grosir<input type="text" inputMode="numeric" value={draft.wholesalePrice} onChange={(event) => update("wholesalePrice", digitsOnly(event.target.value))} /></label>
            <label>Minimum grosir<input type="text" inputMode="numeric" value={draft.wholesaleMinimum} onChange={(event) => update("wholesaleMinimum", digitsOnly(event.target.value))} /></label>
            <label>Stok<input type="text" inputMode="numeric" value={draft.stock} onChange={(event) => update("stock", digitsOnly(event.target.value))} required disabled={Boolean(initialProduct)} />{initialProduct && <small>Ubah melalui menu Stok agar tercatat di audit.</small>}</label>
            <label>Batas stok minimum<input type="text" inputMode="numeric" value={draft.minimumStock} onChange={(event) => update("minimumStock", digitsOnly(event.target.value))} required /></label>
            <label>Berat (gram)<input type="text" inputMode="numeric" value={draft.weightGrams} onChange={(event) => update("weightGrams", digitsOnly(event.target.value))} required /></label>
            <label>Terjual<input type="text" inputMode="numeric" value={draft.sold} onChange={(event) => update("sold", digitsOnly(event.target.value))} disabled={Boolean(initialProduct)} /></label>
            <label>Rating<input type="text" inputMode="decimal" value={draft.rating} onChange={(event) => update("rating", decimalOnly(event.target.value))} /></label>
          </div>
        </section>
      ) : (
        <section className="admin-panel">
          <div className="admin-panel__heading"><div><span>VARIAN PRODUK</span><h2>Ukuran, model, atau jenis</h2></div><button type="button" className="button button--secondary" onClick={addVariant}><Plus size={16} /> Tambah varian</button></div>
          <p className="admin-panel-note">Contoh: Filter Air → Ukuran A, Ukuran B, Ukuran C. Harga, stok, grosir, berat, dan SKU dikelola per varian.</p>
          <div className="admin-variant-list">
            {draft.variants.map((variant, index) => (
              <article className="admin-variant-card" key={`${variant.id}-${index}`}>
                <div className="admin-variant-card__heading"><strong>Varian {index + 1}</strong><label className="admin-check"><input type="checkbox" checked={variant.isActive} onChange={(event) => updateVariant(index, "isActive", event.target.checked)} /> Aktif</label><button type="button" onClick={() => removeVariant(index)} aria-label={`Hapus varian ${index + 1}`}><Trash2 size={16} /></button></div>
                <div className="admin-form-grid admin-form-grid--four">
                  <label className="span-2">Nama varian<input value={variant.name} onChange={(event) => updateVariant(index, "name", event.target.value)} placeholder="Contoh: Ukuran A / 30 cm / 800 L/H" required /></label>
                  <label className="span-2">SKU otomatis<input value={variant.sku || makeVariantSkuPreview(skuPreview, variant.name, index + 1)} readOnly /></label>
                  <label>Harga jual<input type="text" inputMode="numeric" value={variant.price} onChange={(event) => updateVariant(index, "price", digitsOnly(event.target.value))} required /></label>
                  <label>Harga coret<input type="text" inputMode="numeric" value={variant.compareAtPrice} onChange={(event) => updateVariant(index, "compareAtPrice", digitsOnly(event.target.value))} /></label>
                  <label>Harga grosir<input type="text" inputMode="numeric" value={variant.wholesalePrice} onChange={(event) => updateVariant(index, "wholesalePrice", digitsOnly(event.target.value))} /></label>
                  <label>Minimum grosir<input type="text" inputMode="numeric" value={variant.wholesaleMinimum} onChange={(event) => updateVariant(index, "wholesaleMinimum", digitsOnly(event.target.value))} /></label>
                  <label>Stok<input type="text" inputMode="numeric" value={variant.stock} onChange={(event) => updateVariant(index, "stock", digitsOnly(event.target.value))} required disabled={variant.persisted} />{variant.persisted && <small>Ubah dari menu Stok.</small>}</label>
                  <label>Batas stok minimum<input type="text" inputMode="numeric" value={variant.minimumStock} onChange={(event) => updateVariant(index, "minimumStock", digitsOnly(event.target.value))} required /></label>
                  <label>Berat (gram)<input type="text" inputMode="numeric" value={variant.weightGrams} onChange={(event) => updateVariant(index, "weightGrams", digitsOnly(event.target.value))} required /></label>
                  <label>Terjual<input type="text" inputMode="numeric" value={variant.sold} readOnly /></label>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="admin-panel">
        <div className="admin-panel__heading"><div><span>MEDIA CLOUDINARY</span><h2>Gambar utama dan galeri</h2></div></div>
        <div className="admin-media-grid">
          <div className="admin-upload-box">
            {draft.image ? <img src={draft.image} alt="Preview produk" /> : <ImagePlus size={42} />}
            <label className="button button--secondary">{uploading ? <><LoaderCircle size={17} className="spin" /> Mengunggah...</> : <><ImagePlus size={17} /> Pilih gambar utama</>}<input type="file" accept="image/*" hidden disabled={uploading} onChange={(event) => void uploadMain(event.target.files?.[0])} /></label>
            <input value={draft.image} onChange={(event) => update("image", event.target.value)} placeholder="Atau tempel URL gambar" required />
          </div>
          <div>
            <label className="button button--secondary admin-gallery-upload"><Plus size={17} /> Tambah gambar galeri<input type="file" accept="image/*" multiple hidden disabled={uploading} onChange={(event) => void uploadGallery(event.target.files)} /></label>
            <div className="admin-gallery-grid">
              {draft.gallery.map((url, index) => <article key={`${url}-${index}`}><img src={url} alt="" /><button type="button" onClick={() => removeGallery(index)}><Trash2 size={15} /></button></article>)}
            </div>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel__heading"><div><span>SPESIFIKASI</span><h2>Detail teknis</h2></div></div>
        <label className="admin-specs-field">Satu spesifikasi per baris dengan format <strong>Label: Nilai</strong><textarea rows={7} value={draft.specsText} onChange={(event) => update("specsText", event.target.value)} placeholder={'Daya: 10 watt\nUkuran: 30 cm'} /></label>
      </section>

      {error && <div className="admin-error">{error}</div>}
      <div className="admin-form-actions"><button type="button" className="button button--secondary" onClick={() => router.back()}>Batal</button><button className="button button--primary" disabled={saving || uploading}><Save size={17} /> {saving ? "Menyimpan..." : "Simpan produk"}</button></div>
    </form>
  );
}
