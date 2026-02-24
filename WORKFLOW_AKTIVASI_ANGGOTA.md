# 📋 WORKFLOW AKTIVASI ANGGOTA KOPERASI

## 🔄 Alur Lengkap dari Pendaftaran hingga Aktif

### **TAHAP 1: Pendaftaran** (Status: Pending)

**Dilakukan oleh:** Calon Anggota

1. Calon anggota mengisi form pendaftaran di halaman **Daftar Anggota**
2. Upload foto diri & foto KTP
3. Setujui syarat & ketentuan
4. Submit pendaftaran
5. **Status otomatis**: `Pending` (Menunggu Verifikasi)

---

### **TAHAP 2: Verifikasi Admin** (Status: Diterima/Ditolak)

**Dilakukan oleh:** Admin di halaman **Kelola Anggota**

**Opsi A: SETUJUI PENDAFTARAN**

1. Admin buka detail anggota di Kelola Anggota
2. Cek data lengkap (NIK, foto KTP, data pribadi)
3. Klik tombol **"Setujui Pendaftaran"** (hijau)
4. **Status berubah**: `Pending` → `Diterima`
5. **Notifikasi ke anggota**: "Silakan bayar iuran pokok Rp 100.000"

**Opsi B: TOLAK PENDAFTARAN**

1. Klik tombol **"Tolak Pendaftaran"** (merah)
2. Isi alasan penolakan (WAJIB)
3. **Status berubah**: `Pending` → `Ditolak`
4. **Notifikasi ke anggota**: Tampil alasan penolakan + tombol "Ajukan Ulang"

---

### **TAHAP 3: Pembayaran Iuran Pokok** (Status: Diterima)

**Dilakukan oleh:** Calon Anggota

**Di Portal Anggota:**

1. Anggota login ke portal anggota
2. Lihat status: **"Diterima"**
3. Muncul card **Iuran Pokok** dengan nominal **Rp 100.000**
4. Anggota melakukan **transfer bank** ke rekening koperasi
5. Setelah transfer, klik tombol **"Konfirmasi Sudah Bayar"**
6. Modal konfirmasi muncul dengan pertanyaan: "Apakah sudah bayar Rp 100.000?"
7. Klik **"Ya, Sudah Bayar"**
8. **Flag berubah**: `konfirmasi_bayar_iuran_pokok = TRUE`
9. Toast hijau muncul: "Konfirmasi berhasil!"
10. Status tetap **"Diterima"** tapi ada indikator sudah konfirmasi

---

### **TAHAP 4: Verifikasi Pembayaran & Aktivasi** (Status: Aktif)

**Dilakukan oleh:** Admin/Bendahara di halaman **Kelola Anggota**

**Langkah-langkah Admin:**

1. **Cek List Anggota yang Konfirmasi Bayar**
   - Buka **Kelola Anggota**
   - Filter status: **"Diterima"**
   - Lihat anggota yang ada **info box hijau**: "Anggota sudah konfirmasi pembayaran!"
   - Info box menampilkan tanggal & waktu konfirmasi

2. **Verifikasi Pembayaran Manual**
   - Cek rekening bank koperasi
   - Pastikan ada transfer masuk sebesar **Rp 100.000**
   - Cocokkan nama pengirim dengan nama anggota
   - Cocokkan tanggal transfer dengan tanggal konfirmasi

3. **Aktifkan Anggota**
   - Jika pembayaran sudah diterima, klik tombol **"Aktifkan Anggota"** (biru)
   - **Modal konfirmasi muncul** dengan informasi:
     - Nama & NIK anggota
     - Tanggal konfirmasi pembayaran
     - ⚠️ **Peringatan**: "Pastikan pembayaran sudah diterima!"
     - ✅ Informasi: Nomor anggota akan dibuat otomatis
   - **Cek sekali lagi** rekening bank
   - Klik **"Ya, Aktifkan"** untuk konfirmasi
   - **OTOMATIS TERJADI:**
     - ✅ Status: `Diterima` → `Aktif`
     - ✅ Generate **Nomor Anggota Koperasi** (contoh: `KMDI-001`)
     - ✅ Set `iuran_pokok_dibayar = TRUE`
     - ✅ Set `tanggal_bayar_iuran_pokok = sekarang`
     - ✅ Insert history log: "Diaktifkan"
4. **Anggota Sudah Aktif!**
   - Nomor anggota koperasi terbit
   - Anggota bisa akses semua layanan koperasi
   - Status di portal anggota: **"Aktif"**

---

## 🎯 RINGKASAN UNTUK ADMIN

### **Kapan Nomor Anggota Koperasi Terbit?**

**Nomor anggota koperasi terbit OTOMATIS** saat admin klik **"Aktifkan Anggota"**

### **Prasyarat Aktivasi:**

1. ✅ Status harus **"Diterima"**
2. ✅ Anggota sudah klik **"Konfirmasi Sudah Bayar"** (muncul info box hijau)
3. ✅ Admin sudah verifikasi pembayaran di rekening bank

### **Tombol "Aktifkan Anggota" Muncul Kapan?**

- Hanya muncul jika status = **"Diterima"**
- Muncul setelah anggota konfirmasi bayar (info box hijau)

### **Jika Pembayaran Belum Diterima?**

**PENTING:** Admin harus melakukan penolakan konfirmasi untuk membatalkan status "sudah bayar" yang salah.

**Langkah-langkah:**

1. **JANGAN klik "Verifikasi & Aktifkan Anggota"**
2. Klik tombol **"Tolak Konfirmasi"** (merah/outline)
3. Isi alasan penolakan:
   - Contoh: "Pembayaran belum masuk ke rekening koperasi"
   - Contoh: "Transfer belum diterima hingga hari ini"
4. Klik **"Ya, Tolak Konfirmasi"**
5. **OTOMATIS TERJADI:**
   - ❌ `konfirmasi_bayar_iuran_pokok = FALSE` (reset)
   - ❌ `tanggal_konfirmasi_bayar = NULL` (hapus tanggal)
   - 📝 History log: "Konfirmasi Ditolak" + alasan
   - 🔄 Info box hijau hilang dari admin panel
   - 🔄 Status anggota kembali ke **Diterima (Belum Konfirmasi)**
6. **Anggota harus konfirmasi ulang** setelah benar-benar transfer
7. Hubungi anggota untuk menjelaskan situasi

**Catatan:**

- Status tetap **"Diterima"** (tidak berubah jadi Ditolak)
- Anggota dapat konfirmasi ulang kapan saja setelah benar-benar bayar
- Riwayat penolakan tercatat di history dengan alasan lengkap

---

## 🔔 NOTIFIKASI & INDIKATOR

### **Di Portal Anggota:**

| Status                    | Tampilan                                                    |
| ------------------------- | ----------------------------------------------------------- |
| **Pending**               | ⏳ "Menunggu Verifikasi" (oranye)                           |
| **Ditolak**               | ❌ "Ditolak" (merah) + Alasan + Tombol "Ajukan Ulang"       |
| **Diterima**              | ✅ "Diterima" (biru) + Card Iuran Pokok + Tombol Konfirmasi |
| **Diterima + Konfirmasi** | ✅ "Diterima" + "✓ Konfirmasi pembayaran diterima"          |
| **Aktif**                 | ✅ "Aktif" (hijau) + Nomor Anggota + "Sudah Dibayar"        |

### **Di Admin Panel (Kelola Anggota):**

| Kondisi                            | Info Box                                                                 | Tombol                                             |
| ---------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------- |
| Status Pending                     | -                                                                        | "Setujui" (hijau) & "Tolak" (merah)                |
| Status Diterima + Belum Konfirmasi | ⚠️ "Menunggu calon anggota melakukan pembayaran dan konfirmasi" (kuning) | -                                                  |
| Status Diterima + Sudah Konfirmasi | ✅ "Anggota sudah konfirmasi pembayaran! + tanggal" (hijau)              | 🔴 "Tolak Konfirmasi" & 🟢 "Verifikasi & Aktifkan" |
| Status Aktif                       | ✅ "Anggota Aktif" + Nomor Anggota                                       | -                                                  |

---

## 📊 FORMAT NOMOR ANGGOTA KOPERASI

Nomor anggota otomatis di-generate dengan format:

### **Warga Desa:**

```
KMD[Dusun]-[Nomor Urut RT]
```

**Contoh:** `KMDI-001` (Koperasi Merah Putih Dusun I, nomor urut 001)

### **Warga Luar Desa:**

```
KML-[Nomor Urut]
```

**Contoh:** `KML-001` (Koperasi Merah Putih Luar, nomor urut 001)

**Kode Dusun:**

- Dusun I → `I`
- Dusun II → `II`
- Dusun III → `III`
- Dusun IV → `IV`

---

## 🚨 TROUBLESHOOTING

### **Problem: Tombol "Aktifkan Anggota" tidak muncul**

**Solusi:**

1. Pastikan status = **"Diterima"**
2. Pastikan anggota sudah klik **"Konfirmasi Sudah Bayar"**
3. Refresh halaman admin

### **Problem: Anggota belum konfirmasi padahal sudah bayar**

**Solusi:**

1. Hubungi anggota via WhatsApp
2. Minta anggota login ke portal anggota
3. Klik tombol **"Konfirmasi Sudah Bayar"**
4. Admin refresh halaman Kelola Anggota

### **Problem: Anggota konfirmasi tapi pembayaran belum masuk**

**Solusi:**

1. **JANGAN aktifkan dulu**
2. Cek rekening bank koperasi
3. Hubungi anggota untuk bukti transfer
4. Tunggu sampai transfer masuk (bisa 1-2 hari kerja)
5. Setelah transfer masuk, baru aktifkan

### **Problem: Nomor anggota tidak terbit setelah aktivasi**

**Solusi:**

1. Cek database: `SELECT nomor_anggota_koperasi FROM anggota WHERE id = [id_anggota]`
2. Jika NULL, cek function `generate_nomor_anggota` sudah dibuat
3. Jalankan ulang migration: `database-anggota.sql`

---

## 💡 BEST PRACTICES

### **Untuk Admin:**

1. ✅ Verifikasi data lengkap sebelum approve
2. ✅ Cek foto KTP jelas & sesuai dengan NIK
3. ✅ Selalu cek rekening bank sebelum aktivasi
4. ✅ Dokumentasi nomor rekening pengirim
5. ✅ Jangan aktifkan sebelum uang masuk

### **Untuk Bendahara:**

1. ✅ Buat list harian anggota yang konfirmasi bayar
2. ✅ Cross-check dengan mutasi rekening
3. ✅ Aktivasi batch di akhir hari kerja
4. ✅ Simpan screenshot bukti transfer
5. ✅ Update buku kas jika perlu

### **Untuk Komunikasi:**

1. ✅ Kirim nomor rekening koperasi via broadcast grup
2. ✅ Sertakan format transfer: "IURAN-[nama]"
3. ✅ Berikan panduan screenshot bukti transfer
4. ✅ Response cepat jika ada pertanyaan pembayaran

---

## 📞 INFORMASI PEMBAYARAN

**Rekening Koperasi:**

- Bank: [Nama Bank]
- No. Rekening: [Nomor Rekening]
- Atas Nama: [Nama Koperasi]

**Nominal Iuran Pokok:** Rp 100.000 (sekali bayar)

**Keterangan Transfer:** IURAN-[Nama Anggota]

**Konfirmasi:** Melalui portal anggota (tombol konfirmasi)

---

## 📈 MONITORING & REPORTING

### **Query untuk Cek Anggota Pending Aktivasi:**

```sql
SELECT
  nama_lengkap,
  nik,
  tanggal_konfirmasi_bayar,
  EXTRACT(DAY FROM NOW() - tanggal_konfirmasi_bayar) as hari_tunggu
FROM anggota
WHERE status = 'Diterima'
  AND konfirmasi_bayar_iuran_pokok = TRUE
  AND iuran_pokok_dibayar = FALSE
ORDER BY tanggal_konfirmasi_bayar ASC;
```

### **Query untuk Laporan Aktivasi Bulanan:**

```sql
SELECT
  DATE_TRUNC('month', tanggal_verifikasi) as bulan,
  COUNT(*) as jumlah_aktivasi,
  SUM(CASE WHEN iuran_pokok_dibayar THEN 100000 ELSE 0 END) as total_iuran
FROM anggota
WHERE status = 'Aktif'
  AND tanggal_verifikasi >= DATE_TRUNC('month', NOW())
GROUP BY DATE_TRUNC('month', tanggal_verifikasi);
```

---

**Dokumen ini membantu admin memahami alur lengkap aktivasi anggota koperasi.**

**Terakhir diupdate:** 24 Februari 2026
