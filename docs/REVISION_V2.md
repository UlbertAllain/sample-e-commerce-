# Revision V2 — Customer Account and Storefront Redesign

## 1. Design system

- Mengganti gaya card-heavy dan rounded UI menjadi editorial commerce.
- Palet utama: forest green, warm canvas, black ink, dan acid accent.
- Tipografi display menggunakan serif untuk membangun karakter brand.
- Header dipisahkan menjadi utility bar, primary navigation, dan category navigation.
- Homepage menggunakan komposisi asimetris, product stage, category index, buying guide, dan promo editorial.
- Katalog, detail produk, keranjang, checkout, pembayaran, tracking, invoice, serta footer mengikuti design system yang sama.

## 2. Customer authentication sample

Route baru:

```text
/register
/login
/account
```

Data yang disimpan saat registrasi:

```text
fullName
email
phone
password
province
city
district
postalCode
address
```

Pada sample, data akun dan session disimpan di `localStorage` melalui:

```text
src/features/auth/auth-storage.ts
src/context/auth-provider.tsx
```

## 3. Checkout berbasis profil

Checkout tidak lagi meminta pengguna mengisi data penerima dari awal. Sistem melakukan langkah berikut:

```text
Cart
→ buka checkout
→ jika belum login, arahkan ke login/register
→ ambil profil pelanggan
→ tampilkan alamat utama
→ pelanggan memilih kurir dan pembayaran
→ buat order menggunakan snapshot profil
```

Alamat dapat diubah melalui `/account` sebelum order dibuat.

## 4. Resi

Tiga opsi dokumen tersedia pada halaman detail pesanan:

- Cetak invoice.
- Cetak shipping label A6 atau simpan sebagai PDF.
- Unduh shipping label sebagai PNG resolusi tinggi.

Implementasi gambar dan print label berada di:

```text
src/features/orders/shipping-label-image.ts
```

## 5. Batas produksi

Fungsi auth lokal hanya untuk demonstrasi. Fase produksi harus menggantinya dengan Firebase Authentication dan penyimpanan profil pada Firestore. Pembuatan order, pembayaran, stok, dan status pengiriman harus dipindahkan ke server.
