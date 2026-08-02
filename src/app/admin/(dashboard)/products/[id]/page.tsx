import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getProduct } from "@/features/catalog/product-repository";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  return <><div className="admin-page-heading"><div><span>EDIT PRODUK</span><h1>{product.shortName}</h1><p>Perubahan akan langsung digunakan oleh storefront setelah disimpan.</p></div></div><ProductForm initialProduct={product} /></>;
}
