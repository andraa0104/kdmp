# KONSEP DATABASE - KOPERASI MERAH PUTIH
## PostgreSQL Database Design

---

## 📋 DAFTAR TABEL (20 Tabel)

### **A. MASTER DATA (5 Tabel)**

#### 1. **dusun**
Menyimpan data dusun di Desa Purwajaya
```
- id (PK)
- nama (UNIQUE)
- created_at, updated_at
```

#### 2. **rt**
Menyimpan data RT per dusun (relasi dengan dusun)
```
- id (PK)
- dusun_id (FK -> dusun)
- nomor
- created_at, updated_at
- UNIQUE(dusun_id, nomor)
```

#### 3. **roles**
Menyimpan role pengguna (Superadmin, Admin, Pengurus, Anggota)
```
- id (PK)
- nama (UNIQUE)
- deskripsi
- level (1=Superadmin, 2=Admin, 3=Pengurus, 4=Anggota)
- created_at, updated_at
```

#### 4. **jabatan**
Menyimpan jabatan untuk pengurus (Ketua, Sekretaris, Bendahara, dll)
```
- id (PK)
- nama (UNIQUE)
- deskripsi
- created_at, updated_at
```

#### 5. **menu**
Menyimpan menu sistem untuk permission management
```
- id (PK)
- nama
- path
- icon
- parent_id (FK -> menu, untuk sub-menu)
- urutan
- is_active
- created_at
```

---

### **B. USER & AUTHENTICATION (2 Tabel)**

#### 6. **users**
Menyimpan data login semua pengguna sistem
```
- id (PK)
- username (UNIQUE)
- password (hashed)
- role_id (FK -> roles)
- jabatan_id (FK -> jabatan, nullable untuk non-pengurus)
- is_active
- last_login
- created_at, updated_at
```

#### 7. **anggota**
Menyimpan data lengkap anggota koperasi
```
- id (PK)
- user_id (FK -> users, UNIQUE)
- no_anggota (UNIQUE, auto-generated)
- nik (UNIQUE)
- nama_lengkap
- jenis_kelamin (laki-laki/perempuan)
- tempat_lahir, tanggal_lahir, umur
- foto_diri (path file)

ALAMAT:
- jenis_warga (warga_desa/warga_luar)
- alamat
- dusun_id (FK -> dusun, nullable)
- rt_id (FK -> rt, nullable)
- desa, kecamatan, kabupaten, provinsi

KONTAK:
- nomor_wa

BANK:
- nama_bank, nomor_rekening, atas_nama

STATUS:
- status_keanggotaan (pending/active/inactive/suspended)
- tanggal_bergabung, tanggal_keluar

- created_at, updated_at
```

---

### **C. SIMPANAN & PINJAMAN (4 Tabel)**

#### 8. **simpanan**
Menyimpan transaksi simpanan (Pokok, Wajib, Sukarela)
```
- id (PK)
- anggota_id (FK -> anggota)
- jenis_simpanan (pokok/wajib/sukarela)
- jumlah
- tanggal_transaksi
- keterangan
- created_by (FK -> users)
- created_at, updated_at
```

#### 9. **pinjaman**
Menyimpan data pinjaman anggota
```
- id (PK)
- anggota_id (FK -> anggota)
- no_pinjaman (UNIQUE, auto-generated)
- jenis_pinjaman (modal_usaha/pendidikan/darurat)
- jumlah_pinjaman
- bunga_persen
- jangka_waktu_bulan
- angsuran_per_bulan
- total_bayar
- sisa_pinjaman
- tanggal_pinjaman, tanggal_jatuh_tempo
- status (pending/approved/active/lunas/rejected)
- keterangan
- approved_by (FK -> users)
- approved_at
- created_at, updated_at
```

#### 10. **angsuran**
Menyimpan detail angsuran per pinjaman
```
- id (PK)
- pinjaman_id (FK -> pinjaman)
- angsuran_ke
- jumlah_angsuran
- tanggal_jatuh_tempo, tanggal_bayar
- status (belum_bayar/lunas/terlambat)
- denda
- keterangan
- created_by (FK -> users)
- created_at, updated_at
```

#### 11. **transaksi**
Menyimpan log semua transaksi keuangan (untuk laporan)
```
- id (PK)
- anggota_id (FK -> anggota)
- jenis_transaksi (simpanan/pinjaman/angsuran/shu/toko)
- referensi_id (ID dari tabel terkait)
- debit, kredit, saldo
- keterangan
- tanggal_transaksi
- created_by (FK -> users)
- created_at
```

---

### **D. SHU (2 Tabel)**

#### 12. **shu**
Menyimpan data SHU per tahun
```
- id (PK)
- tahun (UNIQUE)
- total_laba
- persen_pades (20%)
- persen_anggota (20%)
- persen_cadangan (40%)
- persen_pengurus (10%)
- persen_dana_sosial (10%)
- total_untuk_anggota
- status (draft/approved/distributed)
- tanggal_rat
- approved_by (FK -> users)
- created_at, updated_at
```

#### 13. **distribusi_shu**
Menyimpan pembagian SHU per anggota
```
- id (PK)
- shu_id (FK -> shu)
- anggota_id (FK -> anggota)
- jasa_modal (60% dari total SHU anggota)
- jasa_transaksi (40% dari total SHU anggota)
- total_shu
- status (pending/transferred/received)
- tanggal_transfer
- keterangan
- created_at, updated_at
- UNIQUE(shu_id, anggota_id)
```

---

### **E. TOKO KOPERASI (3 Tabel)**

#### 14. **produk**
Menyimpan data produk toko
```
- id (PK)
- kode_produk (UNIQUE)
- nama_produk
- kategori
- harga_beli, harga_jual
- stok
- satuan
- deskripsi
- foto_produk
- is_active
- created_at, updated_at
```

#### 15. **penjualan**
Menyimpan transaksi penjualan toko
```
- id (PK)
- no_transaksi (UNIQUE)
- anggota_id (FK -> anggota, nullable)
- total_belanja
- metode_pembayaran (tunai/kredit)
- status (pending/lunas/kredit)
- tanggal_transaksi
- kasir_id (FK -> users)
- created_at, updated_at
```

#### 16. **detail_penjualan**
Menyimpan detail item per transaksi penjualan
```
- id (PK)
- penjualan_id (FK -> penjualan)
- produk_id (FK -> produk)
- jumlah
- harga_satuan
- subtotal
- created_at
```

---

### **F. KONTEN & BERITA (1 Tabel)**

#### 17. **berita**
Menyimpan berita/artikel koperasi
```
- id (PK)
- judul
- slug (UNIQUE)
- konten
- gambar
- kategori
- is_published
- tanggal_publish
- views
- author_id (FK -> users)
- created_at, updated_at
```

---

### **G. PERMISSION & SECURITY (3 Tabel)**

#### 18. **role_permissions**
Menyimpan permission per role per menu
```
- id (PK)
- role_id (FK -> roles)
- menu_id (FK -> menu)
- can_view, can_create, can_edit, can_delete
- created_at
- UNIQUE(role_id, menu_id)
```

#### 19. **notifikasi**
Menyimpan notifikasi untuk user/role
```
- id (PK)
- judul
- pesan
- jenis (info/warning/success/error)
- target_role_id (FK -> roles, nullable)
- target_user_id (FK -> users, nullable)
- is_read
- created_by (FK -> users)
- created_at
```

#### 20. **audit_log**
Menyimpan log aktivitas user (untuk audit trail)
```
- id (PK)
- user_id (FK -> users)
- action (create/update/delete/login/logout)
- table_name
- record_id
- old_data (JSONB)
- new_data (JSONB)
- ip_address
- user_agent
- created_at
```

---

## 🔗 RELASI ANTAR TABEL

### **1. User Management**
```
users (1) -> (1) anggota
users (N) -> (1) roles
users (N) -> (1) jabatan (nullable)
```

### **2. Alamat**
```
anggota (N) -> (1) dusun (nullable)
anggota (N) -> (1) rt (nullable)
rt (N) -> (1) dusun
```

### **3. Keuangan**
```
anggota (1) -> (N) simpanan
anggota (1) -> (N) pinjaman
pinjaman (1) -> (N) angsuran
anggota (1) -> (N) transaksi
```

### **4. SHU**
```
shu (1) -> (N) distribusi_shu
distribusi_shu (N) -> (1) anggota
```

### **5. Toko**
```
penjualan (1) -> (N) detail_penjualan
detail_penjualan (N) -> (1) produk
penjualan (N) -> (1) anggota (nullable)
```

### **6. Permission**
```
roles (1) -> (N) role_permissions
menu (1) -> (N) role_permissions
menu (1) -> (N) menu (self-reference untuk sub-menu)
```

---

## 📊 FITUR UTAMA DATABASE

### **1. Role-Based Access Control (RBAC)**
- 10 role berbeda dengan level hierarki
- Permission granular per menu (View/Create/Edit/Delete)
- Jabatan khusus untuk pengurus

### **2. Alamat Dinamis**
- Dusun & RT dapat dikelola dari admin panel
- RT terikat dengan dusun tertentu
- Support warga desa dan warga luar desa

### **3. Sistem Simpanan**
- 3 jenis simpanan (Pokok, Wajib, Sukarela)
- Tracking lengkap per anggota

### **4. Sistem Pinjaman**
- 3 jenis pinjaman dengan bunga berbeda
- Approval workflow
- Angsuran otomatis dengan tracking keterlambatan
- Denda untuk angsuran terlambat

### **5. Pembagian SHU**
- Perhitungan otomatis berdasarkan jasa modal (60%) dan jasa transaksi (40%)
- Distribusi ke 5 kategori (PADes, Anggota, Cadangan, Pengurus, Dana Sosial)
- Tracking status transfer per anggota

### **6. Toko Koperasi**
- Manajemen produk dengan stok
- Transaksi tunai dan kredit
- Detail penjualan per item

### **7. Audit & Security**
- Audit log untuk semua aktivitas penting
- Notifikasi sistem untuk user/role
- Tracking login dan aktivitas user

---

## 🎯 KEUNGGULAN DESAIN

1. **Normalisasi**: Database sudah dinormalisasi untuk menghindari redundansi
2. **Scalability**: Struktur mendukung pertumbuhan data hingga ribuan anggota
3. **Flexibility**: Mudah menambah fitur baru tanpa mengubah struktur existing
4. **Security**: Audit log dan permission management yang ketat
5. **Performance**: Index pada kolom yang sering di-query
6. **Data Integrity**: Foreign key constraints dan unique constraints

---

## 📈 ESTIMASI UKURAN DATA (1000 Anggota)

- **users**: ~1000 rows
- **anggota**: ~1000 rows
- **simpanan**: ~36,000 rows/tahun (1000 anggota × 3 jenis × 12 bulan)
- **pinjaman**: ~500 rows/tahun (50% anggota pinjam)
- **angsuran**: ~6,000 rows/tahun (500 pinjaman × 12 bulan rata-rata)
- **transaksi**: ~50,000 rows/tahun (semua transaksi)
- **penjualan**: ~10,000 rows/tahun
- **detail_penjualan**: ~50,000 rows/tahun

**Total estimasi**: ~150,000 - 200,000 rows/tahun untuk transaksi aktif

---

## 🔧 TEKNOLOGI YANG DIREKOMENDASIKAN

### **Backend**
- Node.js + Express + TypeScript
- Prisma ORM (untuk type-safe database access)
- bcrypt (untuk password hashing)
- JWT (untuk authentication)

### **Database**
- PostgreSQL 14+ (managed service di Railway/DigitalOcean)
- Redis (untuk caching dan session, optional)

### **Deployment**
- Frontend: Vercel (free)
- Backend + Database: Railway ($5/month) atau DigitalOcean ($27/month)

---

## 📝 CATATAN PENTING

1. **Password**: Harus di-hash menggunakan bcrypt dengan salt rounds minimal 10
2. **No Anggota**: Auto-generate dengan format: KMP-YYYY-XXXX (contoh: KMP-2024-0001)
3. **No Pinjaman**: Auto-generate dengan format: PJM-YYYY-XXXX
4. **No Transaksi Toko**: Auto-generate dengan format: TRX-YYYYMMDD-XXXX
5. **Foto**: Simpan di cloud storage (AWS S3/Cloudinary), database hanya simpan URL
6. **Backup**: Automated daily backup untuk data keuangan
7. **Soft Delete**: Untuk data penting (anggota, pinjaman), gunakan status inactive daripada delete
