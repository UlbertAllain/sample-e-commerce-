"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProductById } from "@/data/products";
import type { CartDisplayLine, CartLine } from "@/types/commerce";

const CART_KEY = "berkah-oyot:cart";

type StoreContextValue = {
  cart: CartLine[];
  displayLines: CartDisplayLine[];
  itemCount: number;
  subtotal: number;
  hydrated: boolean;
  addToCart: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_KEY);
      if (raw) setCart(JSON.parse(raw) as CartLine[]);
    } catch {
      setCart([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const displayLines = useMemo<CartDisplayLine[]>(
    () =>
      cart.flatMap((line) => {
        const product = getProductById(line.productId);
        if (!product) return [];
        const unitPrice =
          product.wholesalePrice &&
          product.wholesaleMinimum &&
          line.quantity >= product.wholesaleMinimum
            ? product.wholesalePrice
            : product.price;
        return [{ product, quantity: line.quantity, unitPrice, subtotal: unitPrice * line.quantity }];
      }),
    [cart],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      cart,
      displayLines,
      itemCount: cart.reduce((total, line) => total + line.quantity, 0),
      subtotal: displayLines.reduce((total, line) => total + line.subtotal, 0),
      hydrated,
      addToCart(productId, quantity = 1) {
        setCart((current) => {
          const existing = current.find((line) => line.productId === productId);
          if (!existing) return [...current, { productId, quantity }];
          return current.map((line) =>
            line.productId === productId
              ? { ...line, quantity: Math.max(1, line.quantity + quantity) }
              : line,
          );
        });
      },
      updateQuantity(productId, quantity) {
        if (quantity <= 0) {
          setCart((current) => current.filter((line) => line.productId !== productId));
          return;
        }
        setCart((current) =>
          current.map((line) => (line.productId === productId ? { ...line, quantity } : line)),
        );
      },
      removeFromCart(productId) {
        setCart((current) => current.filter((line) => line.productId !== productId));
      },
      clearCart() {
        setCart([]);
      },
    }),
    [cart, displayLines, hydrated],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore harus digunakan di dalam StoreProvider");
  return context;
}
