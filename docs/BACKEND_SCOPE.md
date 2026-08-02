# Scope Backend dan Admin

## Sudah tersedia

- Firebase Authentication untuk customer dan administrator.
- Session cookie HTTP-only.
- Custom claim role `admin`.
- Firestore repository server-side.
- Produk dan kategori dinamis.
- Cloudinary signed upload untuk produk dan QRIS.
- Checkout server-side dengan validasi ulang harga dan stok.
- Firestore transaction untuk order dan mutasi stok.
- Riwayat order pelanggan.
- Dashboard admin.
- CRUD produk.
- Manajemen kategori.
- Pemrosesan order.
- Penyesuaian dan audit stok.
- Direktori pelanggan.
- Pengaturan toko, rekening, metode pembayaran, dan layanan pengiriman.
- Cetak invoice dan download resi.
- Firestore rules deny-all untuk akses browser.

## Masih berupa simulasi

- Payment gateway nyata.
- Webhook pembayaran.
- Perhitungan ongkir berdasarkan alamat dan berat.
- Pembuatan resi melalui API aggregator.
- Pickup kurir.
- Tracking otomatis dari kurir.
- Refund ke rekening atau payment gateway.
- Email/WhatsApp transactional.

Bagian simulasi dipisahkan dari core order agar bisa diganti melalui adapter atau endpoint integrasi pada tahap produksi.
