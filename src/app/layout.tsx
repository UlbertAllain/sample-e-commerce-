import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthProvider } from "@/context/auth-provider";
import { StoreProvider } from "@/context/store-provider";

export const metadata: Metadata = {
  title: { default: "Berkah Oyot", template: "%s | Berkah Oyot" },
  description: "Storefront Berkah Oyot untuk katalog, akun pelanggan, checkout, pembayaran, dan pengiriman.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <StoreProvider>
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
