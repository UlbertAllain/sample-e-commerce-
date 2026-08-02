# Scope Demo Client

## Sudah tersedia

- Homepage baru dengan pendekatan editorial commerce
- Katalog, pencarian, filter, dan detail produk
- Keranjang persisten
- Register pelanggan dengan data diri dan alamat lengkap
- Login, logout, session lokal, serta halaman akun
- Perubahan profil dan alamat utama
- Checkout yang otomatis mengambil data pelanggan dari profil
- Voucher dan pilihan kurir
- Transfer, QRIS, dan COD sample
- Nomor pesanan dan resi
- Tracking timeline
- Riwayat transaksi pelanggan
- Invoice yang dapat dicetak
- Shipping label yang dapat dicetak atau disimpan sebagai PDF
- Shipping label yang dapat diunduh sebagai PNG

## Sengaja belum diaktifkan

- Dashboard admin
- Firebase Authentication live
- Firestore live
- Upload Cloudinary live
- Payment gateway nyata
- Tarif dan tracking kurir nyata
- Pengurangan stok transaksi nyata
- Email/WhatsApp notification

## Catatan

Akun, password, profil, keranjang, dan transaksi pada demo disimpan di `localStorage`. Implementasi tersebut hanya digunakan untuk presentasi alur. Versi produksi wajib memindahkan authentication, data pelanggan, order, pembayaran, stok, dan pengiriman ke backend yang tervalidasi.
