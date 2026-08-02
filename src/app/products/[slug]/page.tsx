import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug as getFallbackProduct } from "@/data/products";
import { getProductBySlug } from "@/features/catalog/product-repository";
import { ProductDetailClient } from "./product-detail-client";

export const dynamic = "force-dynamic";

async function resolveProduct(slug: string) {
  try {
    return (await getProductBySlug(slug)) ?? getFallbackProduct(slug);
  } catch (error) {
    console.error("Firestore belum tersedia; memakai produk lokal.", error);
    return getFallbackProduct(slug);
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await resolveProduct(slug);
  return product ? { title: product.name, description: product.description } : { title: "Produk tidak ditemukan" };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await resolveProduct(slug);
  if (!product) notFound();
  return <ProductDetailClient product={product} />;
}
