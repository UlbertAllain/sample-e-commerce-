# Migrasi Sample ke Produksi

## 0. Authentication dan profil pelanggan

Ganti penyimpanan akun lokal dengan Firebase Authentication. Data profil dan alamat utama disimpan pada dokumen `customers/{uid}`. Password tidak boleh disimpan di Firestore atau `localStorage`. Checkout mengambil profil berdasarkan session user yang tervalidasi pada server.

Field minimum profil pelanggan:

```text
uid
fullName
email
phone
primaryAddress
createdAt
updatedAt
```


## 1. Firestore

Ganti `mockProductRepository` dengan implementasi Firestore tanpa mengubah komponen UI. Koleksi minimum:

```text
products
categories
customers
orders
orderItems
payments
shipments
inventoryMovements
promotions
settings
```

Semua perubahan harga, stok, pembayaran, dan status pengiriman harus divalidasi dari server. Browser tidak boleh menjadi sumber kebenaran untuk transaksi produksi.

## 2. Cloudinary

Gunakan signed upload melalui route server untuk produk, banner, dan bukti pembayaran. Jangan pernah mengirim `CLOUDINARY_API_SECRET` ke browser. Simpan hanya `public_id`, URL hasil optimasi, width, height, dan format pada Firestore.

## 3. Payment gateway

Alur produksi:

```text
Checkout
→ server membuat order pending
→ server meminta transaksi ke payment gateway
→ pelanggan membayar
→ gateway mengirim webhook
→ server memverifikasi signature dan nominal
→ pembayaran ditandai paid secara idempotent
→ stok reservasi menjadi stok terjual
```

Tombol simulasi pembayaran harus dihapus pada mode produksi.

## 4. Pengiriman

Integrasikan agregator atau API kurir untuk tarif, pembuatan resi, pickup, dan tracking. Status kurir dari webhook/API dipetakan ke status internal agar UI tidak bergantung pada istilah masing-masing kurir.

## 5. Inventory

Gunakan transaksi server untuk reservasi stok. Model minimum:

```text
physicalStock
reservedStock
availableStock = physicalStock - reservedStock
minimumStock
```

Setiap perubahan harus membuat `inventoryMovement` agar dapat diaudit.

## 6. Admin

Role awal:

- Super Admin
- Store Admin
- Warehouse
- Finance
- Customer Service

Permission harus diperiksa pada server dan Firestore Security Rules, bukan sekadar menyembunyikan menu.
