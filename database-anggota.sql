-- =====================================================
-- TABEL ANGGOTA KOPERASI
-- =====================================================

CREATE TABLE IF NOT EXISTS anggota (
  id SERIAL PRIMARY KEY,
  
  -- Nomor Identitas & Keanggotaan
  nomor_anggota_koperasi VARCHAR(9) UNIQUE, -- Format: 101010001 (auto-generate saat aktif)
  no_registrasi VARCHAR(20) UNIQUE NOT NULL, -- Format: REG-20260224-001 (auto-generate saat daftar)
  nik VARCHAR(16) UNIQUE NOT NULL,
  
  -- Data Pribadi
  nama_lengkap VARCHAR(255) NOT NULL,
  jenis_kelamin VARCHAR(10) NOT NULL, -- 'laki-laki', 'perempuan'
  tempat_lahir VARCHAR(100) NOT NULL,
  tanggal_lahir DATE NOT NULL,
  -- Note: Umur tidak disimpan karena data dinamis, dihitung dari tanggal_lahir
  
  -- Data Alamat
  jenis_warga VARCHAR(20) NOT NULL, -- 'warga_desa', 'warga_luar'
  alamat TEXT NOT NULL,
  rt VARCHAR(10) NOT NULL,
  desa VARCHAR(100) NOT NULL,
  kecamatan VARCHAR(100) NOT NULL,
  kabupaten VARCHAR(100) NOT NULL,
  provinsi VARCHAR(100) NOT NULL,
  
  -- Relasi Dusun & RT (untuk warga desa)
  dusun_id INT REFERENCES dusun(id) ON DELETE SET NULL, -- NULL jika warga luar
  rt_id INT REFERENCES rt(id) ON DELETE SET NULL, -- NULL jika warga luar
  
  -- Data Bank
  nomor_rekening VARCHAR(50) NOT NULL,
  nama_bank VARCHAR(100) NOT NULL,
  nama_bank_lainnya VARCHAR(100), -- Jika pilih "Bank Lainnya"
  atas_nama VARCHAR(255) NOT NULL,
  
  -- Kontak & Akun
  nomor_wa VARCHAR(20) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Hashed
  foto_diri TEXT, -- Base64 or URL
  foto_ktp TEXT, -- Foto KTP dalam format Base64 or URL
  
  -- Status & Verifikasi
  status VARCHAR(20) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Ditolak', 'Diterima', 'Non Aktif', 'Aktif'
  tanggal_daftar TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tanggal_verifikasi TIMESTAMP,
  verified_by INT REFERENCES users(id) ON DELETE SET NULL, -- Admin yang verifikasi
  alasan_ditolak TEXT, -- Jika status = 'Ditolak'
  
  -- Pembayaran Iuran
  iuran_pokok_dibayar BOOLEAN DEFAULT FALSE, -- Rp 100.000
  tanggal_bayar_iuran_pokok TIMESTAMP,
  bukti_bayar_iuran_pokok TEXT, -- URL/Base64 bukti transfer
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES untuk Performance
-- =====================================================

-- Single Column Indexes (untuk UNIQUE constraints dan foreign keys)
CREATE INDEX idx_anggota_nomor_anggota ON anggota(nomor_anggota_koperasi);
CREATE INDEX idx_anggota_no_registrasi ON anggota(no_registrasi);
CREATE INDEX idx_anggota_nik ON anggota(nik);
CREATE INDEX idx_anggota_username ON anggota(username);
CREATE INDEX idx_anggota_dusun_id ON anggota(dusun_id);
CREATE INDEX idx_anggota_rt_id ON anggota(rt_id);
CREATE INDEX idx_anggota_verified_by ON anggota(verified_by);

-- Composite Indexes (untuk query filtering yang sering digunakan)
-- Query: Filter by status + sort by tanggal_daftar DESC
CREATE INDEX idx_anggota_status_tanggal ON anggota(status, tanggal_daftar DESC);

-- Query: Filter by status + jenis_warga
CREATE INDEX idx_anggota_status_jenis_warga ON anggota(status, jenis_warga);

-- Query: Filter by jenis_warga + dusun_id + rt_id (untuk generate nomor anggota)
CREATE INDEX idx_anggota_jenis_dusun_rt ON anggota(jenis_warga, dusun_id, rt_id);

-- Query: Filter by rt_id + status (untuk counting anggota per RT)
CREATE INDEX idx_anggota_rt_status ON anggota(rt_id, status) WHERE status = 'Aktif';

-- Query: Login - username lookup with status check
CREATE INDEX idx_anggota_username_status ON anggota(username, status);

-- Partial Indexes (untuk status yang sering diquery - mengurangi ukuran index)
-- Status Pending - untuk admin dashboard (verifikasi baru)
CREATE INDEX idx_anggota_pending ON anggota(tanggal_daftar DESC) 
WHERE status = 'Pending';

-- Status Aktif - untuk counting dan reporting
CREATE INDEX idx_anggota_aktif ON anggota(nomor_anggota_koperasi) 
WHERE status = 'Aktif' AND nomor_anggota_koperasi IS NOT NULL;

-- Status Diterima - menunggu pembayaran
CREATE INDEX idx_anggota_diterima_bayar ON anggota(tanggal_verifikasi DESC) 
WHERE status = 'Diterima' AND iuran_pokok_dibayar = FALSE;

-- Text Search Indexes (untuk pencarian nama dengan ILIKE)
-- Install extension terlebih dahulu: CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX idx_anggota_nama_trgm ON anggota USING gin(nama_lengkap gin_trgm_ops);

-- B-tree Index untuk ILIKE '%pattern%' (fallback jika pg_trgm tidak tersedia)
CREATE INDEX idx_anggota_nama_lower ON anggota(LOWER(nama_lengkap));
CREATE INDEX idx_anggota_nik_prefix ON anggota(nik varchar_pattern_ops);
CREATE INDEX idx_anggota_no_reg_prefix ON anggota(no_registrasi varchar_pattern_ops);

-- Covering Index (untuk query list dengan JOIN - include columns yang sering diakses)
CREATE INDEX idx_anggota_list_covering ON anggota(status, tanggal_daftar DESC)
INCLUDE (id, no_registrasi, nomor_anggota_koperasi, nik, nama_lengkap, 
         jenis_kelamin, jenis_warga, dusun_id, rt_id, tanggal_verifikasi);

-- Index untuk Payment Status (iuran pokok)
CREATE INDEX idx_anggota_iuran_status ON anggota(iuran_pokok_dibayar, status)
WHERE status IN ('Diterima', 'Aktif');

-- =====================================================
-- TABEL VERIFIKASI HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS verifikasi_history (
  id SERIAL PRIMARY KEY,
  anggota_id INT NOT NULL REFERENCES anggota(id) ON DELETE CASCADE,
  status_sebelum VARCHAR(20) NOT NULL,
  status_sesudah VARCHAR(20) NOT NULL,
  catatan TEXT,
  verified_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verifikasi_anggota ON verifikasi_history(anggota_id);
CREATE INDEX idx_verifikasi_created ON verifikasi_history(created_at);

-- Composite Index untuk query history dengan filter
CREATE INDEX idx_verifikasi_anggota_created ON verifikasi_history(anggota_id, created_at DESC);

-- Index untuk audit trail by admin
CREATE INDEX idx_verifikasi_admin ON verifikasi_history(verified_by, created_at DESC);

-- Index untuk tracking status changes
CREATE INDEX idx_verifikasi_status ON verifikasi_history(status_sesudah, created_at DESC);

-- =====================================================
-- TABEL PEMBAYARAN IURAN
-- =====================================================

CREATE TABLE IF NOT EXISTS pembayaran_iuran (
  id SERIAL PRIMARY KEY,
  anggota_id INT NOT NULL REFERENCES anggota(id) ON DELETE CASCADE,
  jenis_iuran VARCHAR(20) NOT NULL, -- 'pokok', 'wajib'
  jumlah DECIMAL(10, 2) NOT NULL,
  tanggal_bayar TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  bukti_bayar TEXT, -- URL/Base64
  metode_pembayaran VARCHAR(50), -- 'transfer', 'tunai'
  catatan TEXT,
  verified_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pembayaran_anggota ON pembayaran_iuran(anggota_id);
CREATE INDEX idx_pembayaran_jenis ON pembayaran_iuran(jenis_iuran);
CREATE INDEX idx_pembayaran_tanggal ON pembayaran_iuran(tanggal_bayar);

-- Composite Index untuk query history pembayaran per anggota
CREATE INDEX idx_pembayaran_anggota_tanggal ON pembayaran_iuran(anggota_id, tanggal_bayar DESC);

-- Index untuk reporting per jenis iuran dan periode
CREATE INDEX idx_pembayaran_jenis_tanggal ON pembayaran_iuran(jenis_iuran, tanggal_bayar DESC);

-- Index untuk query pembayaran yang perlu verifikasi
CREATE INDEX idx_pembayaran_verifikasi ON pembayaran_iuran(verified_by) 
WHERE verified_by IS NOT NULL;

-- Covering Index untuk summary pembayaran
CREATE INDEX idx_pembayaran_summary ON pembayaran_iuran(jenis_iuran, tanggal_bayar DESC)
INCLUDE (anggota_id, jumlah, metode_pembayaran);

-- =====================================================
-- TRIGGER untuk auto-update updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_anggota_updated_at
BEFORE UPDATE ON anggota
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Generate No Registrasi
-- =====================================================

CREATE OR REPLACE FUNCTION generate_no_registrasi()
RETURNS VARCHAR AS $$
DECLARE
  tanggal VARCHAR(8);
  counter INT;
  no_reg VARCHAR(20);
BEGIN
  -- Format: REG-YYYYMMDD-XXX
  tanggal := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  -- Hitung jumlah pendaftar hari ini
  SELECT COUNT(*) + 1 INTO counter
  FROM anggota
  WHERE DATE(tanggal_daftar) = CURRENT_DATE;
  
  -- Format counter 3 digit
  no_reg := 'REG-' || tanggal || '-' || LPAD(counter::TEXT, 3, '0');
  
  RETURN no_reg;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Generate Nomor Anggota Koperasi
-- =====================================================

CREATE OR REPLACE FUNCTION generate_nomor_anggota(
  p_jenis_warga VARCHAR,
  p_dusun_id INT,
  p_rt_id INT
)
RETURNS VARCHAR AS $$
DECLARE
  v_prefix VARCHAR(1);
  v_kode_dusun VARCHAR(2);
  v_kode_rt VARCHAR(2);
  v_running_number VARCHAR(4);
  v_nomor_anggota VARCHAR(9);
  v_count INT;
BEGIN
  -- 1. Prefix (1 = warga desa, 2 = warga luar)
  IF p_jenis_warga = 'warga_desa' THEN
    v_prefix := '1';
  ELSE
    v_prefix := '2';
  END IF;
  
  -- 2. Kode Dusun
  IF p_jenis_warga = 'warga_desa' AND p_dusun_id IS NOT NULL THEN
    SELECT kode_dusun INTO v_kode_dusun FROM dusun WHERE id = p_dusun_id;
    v_kode_dusun := LPAD(v_kode_dusun, 2, '0');
  ELSE
    v_kode_dusun := '00';
  END IF;
  
  -- 3. Kode RT
  IF p_rt_id IS NOT NULL THEN
    SELECT kode_rt INTO v_kode_rt FROM rt WHERE id = p_rt_id;
    v_kode_rt := LPAD(v_kode_rt, 2, '0');
  ELSE
    v_kode_rt := '00';
  END IF;
  
  -- 4. Running Number (per RT)
  SELECT COUNT(*) + 1 INTO v_count
  FROM anggota
  WHERE rt_id = p_rt_id 
    AND status = 'Aktif'
    AND nomor_anggota_koperasi IS NOT NULL;
  
  v_running_number := LPAD(v_count::TEXT, 4, '0');
  
  -- 5. Gabungkan
  v_nomor_anggota := v_prefix || v_kode_dusun || v_kode_rt || v_running_number;
  
  RETURN v_nomor_anggota;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA (Optional - untuk testing)
-- =====================================================

-- Contoh insert anggota baru (status Pending)
-- Note: Umur tidak perlu diinsert, akan dihitung otomatis dari tanggal_lahir
-- INSERT INTO anggota (
--   no_registrasi, nik, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir,
--   jenis_warga, alamat, rt, desa, kecamatan, kabupaten, provinsi,
--   dusun_id, rt_id,
--   nomor_rekening, nama_bank, atas_nama,
--   nomor_wa, username, password,
--   status
-- ) VALUES (
--   generate_no_registrasi(),
--   '6401012001900001',
--   'Budi Santoso',
--   'laki-laki',
--   'Samarinda',
--   '1990-01-20',
--   'warga_desa',
--   'Jl. Melati No. 10',
--   '001',
--   'Purwajaya',
--   'Loa Janan',
--   'Kutai Kartanegara',
--   'Kalimantan Timur',
--   1, -- dusun_id
--   1, -- rt_id
--   '1234567890',
--   'BRI',
--   'Budi Santoso',
--   '628123456789',
--   'budi123',
--   '$2b$10$hashed_password', -- Hash password dengan bcrypt
--   'Pending'
-- );

-- =====================================================
-- NOTES
-- =====================================================

-- 1. Nomor Anggota Koperasi (101010001) akan di-generate otomatis
--    saat status berubah menjadi 'Aktif'
--
-- 2. No Registrasi (REG-20260224-001) di-generate saat pendaftaran
--
-- 3. Password harus di-hash menggunakan bcrypt sebelum disimpan
--
-- 4. Foto diri bisa disimpan sebagai:
--    - Base64 string (untuk file kecil)
--    - URL path (jika upload ke storage server)
--
-- 5. Status Flow:
--    Pending → Ditolak (bisa daftar ulang)
--              ↓
--            Diterima → Bayar Iuran → Aktif (generate nomor anggota)
--              ↓
--            Non Aktif (jika tidak aktif lagi)
--
-- 6. Field jenis_warga digunakan untuk:
--    - Generate nomor anggota (prefix 1 atau 2)
--    - Validasi dusun_id dan rt_id (NULL jika warga luar)

-- =====================================================
-- INDEX OPTIMIZATION NOTES
-- =====================================================

-- PERFORMA INDEX:
-- 1. Single Column Indexes: Untuk UNIQUE constraints, foreign keys, dan simple filters
-- 2. Composite Indexes: Untuk query dengan multiple WHERE conditions (order matters!)
-- 3. Partial Indexes: Untuk filter spesifik yang sering digunakan (hemat disk space)
-- 4. Covering Indexes (INCLUDE): Menghindari table lookup dengan include columns
-- 5. Text Search Indexes: Untuk ILIKE queries (gunakan pg_trgm extension jika tersedia)
--
-- COMPOSITE INDEX ORDER RULES:
-- - Kolom equality filters (=) dulu, baru range filters (>, <, BETWEEN)
-- - Kolom yang paling sering difilter di depan
-- - Kolom untuk sorting di belakang
--
-- PARTIAL INDEX BENEFITS:
-- - Ukuran index lebih kecil (hanya indexing subset data)
-- - Query lebih cepat untuk filtered conditions
-- - Mengurangi maintenance overhead saat INSERT/UPDATE
--
-- MAINTENANCE COMMANDS:
-- - Check index usage: 
--   SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
--
-- - Check index size:
--   SELECT indexrelname, pg_size_pretty(pg_relation_size(indexrelid)) 
--   FROM pg_stat_user_indexes WHERE schemaname = 'public';
--
-- - Rebuild bloated indexes:
--   REINDEX TABLE anggota;
--   REINDEX TABLE verifikasi_history;
--   REINDEX TABLE pembayaran_iuran;
--
-- - Analyze tables (update statistics):
--   ANALYZE anggota;
--   ANALYZE verifikasi_history;
--   ANALYZE pembayaran_iuran;
--
-- - Enable pg_trgm extension untuk text search yang lebih cepat:
--   CREATE EXTENSION IF NOT EXISTS pg_trgm;
--   CREATE INDEX idx_anggota_nama_trgm ON anggota USING gin(nama_lengkap gin_trgm_ops);
--
-- AUTO MAINTENANCE:
-- - PostgreSQL auto-vacuum akan otomatis maintain indexes
-- - Untuk production, set autovacuum parameters di postgresql.conf:
--   autovacuum = on
--   autovacuum_vacuum_scale_factor = 0.1
--   autovacuum_analyze_scale_factor = 0.05

-- =====================================================
-- PERFORMANCE MONITORING QUERIES
-- =====================================================

-- 1. Check slow queries (requires pg_stat_statements extension):
-- SELECT query, calls, total_time, mean_time, rows 
-- FROM pg_stat_statements 
-- WHERE query LIKE '%anggota%'
-- ORDER BY total_time DESC 
-- LIMIT 10;

-- 2. Check unused indexes:
-- SELECT schemaname, tablename, indexname, idx_scan
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public' AND idx_scan = 0;

-- 3. Check missing indexes (queries with seq scans):
-- SELECT schemaname, tablename, seq_scan, seq_tup_read,
--        idx_scan, idx_tup_fetch,
--        seq_tup_read / NULLIF(seq_scan, 0) as avg_seq_read
-- FROM pg_stat_user_tables
-- WHERE schemaname = 'public'
-- ORDER BY seq_tup_read DESC;

-- 4. Check table and index sizes:
-- SELECT 
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
--   pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
