# Backend Migration — Berkah Oyot Commerce 1.0

Dokumen ini menjelaskan migrasi storefront statis menjadi aplikasi commerce dengan backend Next.js, Firebase Authentication, Firestore, Firebase Admin SDK, dan Cloudinary.

## 1. Arsitektur

```text
Browser pelanggan / admin
        │
        ├── Firebase Authentication Web SDK
        │       └── email + password, ID token
        │
        └── Next.js Route Handlers
                ├── verifikasi session cookie HTTP-only
                ├── verifikasi role customer/admin
                ├── Firebase Admin SDK
                │       ├── Firestore
                │       └── Firebase Authentication
                └── Cloudinary signed upload
```

Firestore tidak diakses langsung dari browser. `firestore.rules` menggunakan deny-all dan seluruh operasi data dilakukan melalui endpoint server yang memverifikasi session.

## 2. Koleksi Firestore

| Koleksi | Fungsi |
|---|---|
| `products` | Katalog, harga, gambar, status, stok, dan statistik terjual |
| `categories` | Kategori katalog |
| `customers` | Profil dan alamat utama pelanggan |
| `admins` | Direktori akun administrator |
| `orders` | Pesanan, pembayaran, pengiriman, dan snapshot item |
| `inventoryMovements` | Audit perubahan stok |
| `settings/store` | Identitas toko, rekening, QRIS, kurir, dan metode pembayaran |

## 3. Endpoint

### Authentication dan akun

| Method | Endpoint | Akses |
|---|---|---|
| `POST` | `/api/auth/session` | Public setelah Firebase login/register |
| `DELETE` | `/api/auth/session` | Login |
| `GET` | `/api/auth/me` | Public, mengembalikan akun atau `null` |
| `PATCH` | `/api/account/profile` | Customer |

### Storefront

| Method | Endpoint | Akses |
|---|---|---|
| `GET` | `/api/store/products` | Public |
| `GET` | `/api/store/categories` | Public |
| `GET` | `/api/store/settings` | Public |
| `GET` | `/api/store/orders` | Customer |
| `POST` | `/api/store/orders` | Customer |
| `GET` | `/api/store/orders/[identifier]` | Pemilik order atau admin |
| `POST` | `/api/store/orders/[identifier]/payment` | Pemilik order |

### Admin

| Method | Endpoint | Fungsi |
|---|---|---|
| `GET` | `/api/admin/dashboard` | Ringkasan dashboard |
| `GET/POST` | `/api/admin/products` | List dan tambah produk |
| `GET/PATCH/DELETE` | `/api/admin/products/[id]` | Detail, edit, arsip produk |
| `GET/POST` | `/api/admin/categories` | List dan tambah kategori |
| `PATCH/DELETE` | `/api/admin/categories/[id]` | Edit dan nonaktifkan kategori |
| `GET` | `/api/admin/orders` | Semua pesanan |
| `GET/PATCH` | `/api/admin/orders/[id]` | Detail dan pemrosesan order |
| `GET/POST` | `/api/admin/inventory/adjustments` | Mutasi dan penyesuaian stok |
| `GET` | `/api/admin/customers` | Direktori pelanggan |
| `GET/PATCH` | `/api/admin/settings` | Pengaturan toko |
| `POST` | `/api/admin/uploads/signature` | Signature upload Cloudinary |
| `POST` | `/api/admin/bootstrap` | Impor data statis awal jika koleksi kosong |

## 4. Setup Firebase

1. Buat atau pilih Firebase project.
2. Aktifkan **Authentication → Sign-in method → Email/Password**.
3. Buat Firestore Database.
4. Pada **Project Settings → General**, buat Web App lalu salin konfigurasi ke `NEXT_PUBLIC_FIREBASE_*`.
5. Pada **Project Settings → Service Accounts**, generate private key.
6. Masukkan `project_id`, `client_email`, dan `private_key` ke `FIREBASE_ADMIN_*`.
7. Deploy rules dan indexes:

```powershell
npx firebase-tools login
npx firebase-tools use --add
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

Jangan commit service-account JSON atau isi `.env.local`.

## 5. Setup Cloudinary

Isi:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=berkah-oyot/products
```

Admin meminta signature ke endpoint server. File kemudian diunggah langsung dari browser admin ke Cloudinary. API secret tidak pernah dikirim ke browser.

## 6. Membuat admin pertama

Salin `.env.example` menjadi `.env.local`, lalu isi:

```env
ADMIN_EMAIL=admin@berkahoyot.com
ADMIN_PASSWORD=password-kuat-minimal-12-karakter
ADMIN_NAME=Administrator Berkah Oyot
```

Jalankan:

```powershell
npm run admin:create
```

Script akan:

1. membuat atau memperbarui Firebase Auth user;
2. menambahkan custom claim `role: admin`;
3. membuat dokumen `admins/{uid}`;
4. mengaktifkan kembali akun bila sebelumnya dinonaktifkan.

Setelah claim diubah, logout dan login ulang agar ID token baru memuat role admin.

## 7. Menjalankan migrasi

```powershell
npm install
npm run admin:create
npm run dev
```

Buka:

```text
http://localhost:3000/admin/login
```

Setelah login, buka menu **Produk** lalu klik **Impor data awal**. Endpoint bootstrap hanya mengimpor produk atau kategori ketika koleksi terkait masih kosong.

## 8. Alur stok

- Checkout membaca seluruh produk di dalam Firestore transaction.
- Harga dan stok dihitung ulang di server; total dari browser tidak dipercaya.
- Stok dikurangi dan mutasi `sale` ditulis dalam transaksi yang sama.
- Admin tidak mengubah stok melalui edit produk sehari-hari; gunakan menu **Stok** agar ada audit movement.
- Pembatalan order mengembalikan stok satu kali menggunakan flag `stockRestored`.

## 9. Status pembayaran dan pengiriman

Payment pada versi ini masih simulasi server-side. Tombol pembayaran mengubah status melalui endpoint yang memverifikasi pemilik order. Untuk produksi nyata, ganti endpoint simulasi dengan payment gateway dan webhook terverifikasi.

Kurir dan tarif juga masih konfigurasi manual pada admin. Integrasi RajaOngkir, Biteship, Shipper, atau API kurir lain dapat mengganti daftar tarif dan pembuatan nomor resi tanpa mengubah model order utama.

## 10. Quality gate

Setelah dependency terpasang:

```powershell
npm run typecheck
npm run lint
npm run build
```

Registry pada environment pembuatan patch tidak menyediakan `firebase-admin` dan `zod-validation-error`, sehingga dependency install serta build final wajib dijalankan pada komputer pengembang.
