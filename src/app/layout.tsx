import type { Metadata } from "next";
import "./globals.css";
import { SiteChrome } from "@/components/layout/site-chrome";
import { AuthProvider } from "@/context/auth-provider";
import { CatalogProvider } from "@/context/catalog-provider";
import { StoreProvider } from "@/context/store-provider";

export const metadata: Metadata = {
  title: { default: "Berkah Oyot", template: "%s | Berkah Oyot" },
  description: "Toko online Berkah Oyot untuk katalog, akun pelanggan, checkout, pembayaran, pengiriman, dan manajemen admin.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <CatalogProvider>
            <StoreProvider>
              <SiteChrome>{children}</SiteChrome>
            </StoreProvider>
          </CatalogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
