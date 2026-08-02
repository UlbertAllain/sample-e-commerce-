"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getActiveVariants, getSellablePrice, getSellableStock, getVariant } from "@/features/catalog/product-options";
import { useCatalog } from "@/context/catalog-provider";
import type { CartDisplayLine, CartLine } from "@/types/commerce";

const CART_KEY = "berkah-oyot:cart";

function sameLine(line: CartLine, productId: string, variantId?: string, legacyVariantId?: string) {
  if (line.productId !== productId) return false;
  if ((line.variantId ?? "") === (variantId ?? "")) return true;
  return !line.variantId && Boolean(variantId) && variantId === legacyVariantId;
}

type StoreContextValue = {
  cart: CartLine[];
  displayLines: CartDisplayLine[];
  itemCount: number;
  subtotal: number;
  hydrated: boolean;
  addToCart: (productId: string, quantity?: number, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  clearCart: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { getProductById } = useCatalog();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(CART_KEY);
        if (raw) setCart(JSON.parse(raw) as CartLine[]);
      } catch {
        setCart([]);
      } finally {
        setHydrated(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const displayLines = useMemo<CartDisplayLine[]>(() => cart.flatMap((line) => {
    const product = getProductById(line.productId);
    if (!product || product.status !== "active") return [];
    const variant = getVariant(product, line.variantId);
    if (getActiveVariants(product).length && !variant) return [];
    const stock = getSellableStock(product, variant);
    if (stock <= 0) return [];
    const quantity = Math.min(line.quantity, stock);
    const unitPrice = getSellablePrice(product, quantity, variant);
    return [{ product, variant, quantity, unitPrice, subtotal: unitPrice * quantity }];
  }), [cart, getProductById]);

  const value = useMemo<StoreContextValue>(() => ({
    cart,
    displayLines,
    itemCount: cart.reduce((total, line) => total + line.quantity, 0),
    subtotal: displayLines.reduce((total, line) => total + line.subtotal, 0),
    hydrated,
    addToCart(productId, quantity = 1, requestedVariantId) {
      const product = getProductById(productId);
      if (!product) return;
      const activeVariants = getActiveVariants(product);
      const variant = getVariant(product, requestedVariantId);
      if (activeVariants.length && !variant) return;
      const variantId = variant?.id;
      const legacyVariantId = activeVariants[0]?.id;
      const stock = getSellableStock(product, variant);
      if (stock <= 0) return;
      setCart((current) => {
        const existing = current.find((line) => sameLine(line, productId, variantId, legacyVariantId));
        if (!existing) return [...current, { productId, variantId, quantity: Math.min(quantity, stock) }];
        return current.map((line) => sameLine(line, productId, variantId, legacyVariantId) ? { ...line, variantId, quantity: Math.min(stock, Math.max(1, line.quantity + quantity)) } : line);
      });
    },
    updateQuantity(productId, quantity, variantId) {
      const product = getProductById(productId);
      const activeVariants = product ? getActiveVariants(product) : [];
      const legacyVariantId = activeVariants[0]?.id;
      if (quantity <= 0) {
        setCart((current) => current.filter((line) => !sameLine(line, productId, variantId, legacyVariantId)));
        return;
      }
      const variant = product ? getVariant(product, variantId) : undefined;
      const stock = product ? getSellableStock(product, variant) : quantity;
      setCart((current) => current.map((line) => sameLine(line, productId, variantId, legacyVariantId) ? { ...line, variantId, quantity: Math.min(stock, quantity) } : line));
    },
    removeFromCart(productId, variantId) {
      const product = getProductById(productId);
      const legacyVariantId = product ? getActiveVariants(product)[0]?.id : undefined;
      setCart((current) => current.filter((line) => !sameLine(line, productId, variantId, legacyVariantId)));
    },
    clearCart() {
      setCart([]);
    },
  }), [cart, displayLines, hydrated, getProductById]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore harus digunakan di dalam StoreProvider");
  return context;
}
