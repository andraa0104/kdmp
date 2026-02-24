-- Migration: Create verifikasi_history table
-- Date: 2026-02-24
-- Description: Menyimpan riwayat perubahan status anggota (penolakan, pengajuan ulang, verifikasi)

-- Create verifikasi_history table
CREATE TABLE IF NOT EXISTS verifikasi_history (
  id SERIAL PRIMARY KEY,
  anggota_id INT NOT NULL REFERENCES anggota(id) ON DELETE CASCADE,
  status_sebelum VARCHAR(20), -- Status sebelum perubahan
  status_sesudah VARCHAR(20) NOT NULL, -- Status setelah perubahan (Pending, Ditolak, Diterima, dll)
  aksi VARCHAR(50) NOT NULL, -- 'Pendaftaran Baru', 'Ditolak', 'Pengajuan Ulang', 'Diterima', 'Diaktifkan', dll
  catatan TEXT, -- Alasan penolakan atau catatan lainnya
  verified_by INT REFERENCES users(id) ON DELETE SET NULL, -- Admin yang melakukan verifikasi (NULL jika pengajuan ulang)
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
-- Primary index: Most common query is getting history by anggota_id ordered by created_at
CREATE INDEX idx_verifikasi_history_anggota_created ON verifikasi_history(anggota_id, created_at DESC);

-- Individual indexes for specific queries
CREATE INDEX idx_verifikasi_history_anggota_id ON verifikasi_history(anggota_id);
CREATE INDEX idx_verifikasi_history_created_at ON verifikasi_history(created_at DESC);

-- Index for admin reporting: Who verified what
CREATE INDEX idx_verifikasi_history_verified_by ON verifikasi_history(verified_by) WHERE verified_by IS NOT NULL;

-- Index for filtering by action type
CREATE INDEX idx_verifikasi_history_aksi ON verifikasi_history(aksi);

-- Index for filtering by status
CREATE INDEX idx_verifikasi_history_status ON verifikasi_history(status_sesudah);

-- Composite index for complex queries: anggota + status + date
CREATE INDEX idx_verifikasi_history_composite ON verifikasi_history(anggota_id, status_sesudah, created_at DESC);

-- Add comments
COMMENT ON TABLE verifikasi_history IS 'Riwayat perubahan status verifikasi anggota';
COMMENT ON COLUMN verifikasi_history.aksi IS 'Jenis aksi: Pendaftaran Baru, Ditolak, Pengajuan Ulang, Diterima, Diaktifkan, Non Aktif';
COMMENT ON COLUMN verifikasi_history.catatan IS 'Alasan penolakan atau catatan perubahan status';

-- Index Usage Comments:
-- idx_verifikasi_history_anggota_created: Optimizes portal anggota dashboard (get history by anggota_id ORDER BY created_at DESC)
-- idx_verifikasi_history_anggota_id: For JOIN queries with anggota table
-- idx_verifikasi_history_created_at: For admin dashboard showing recent activities
-- idx_verifikasi_history_verified_by: For admin reporting (partial index, only non-NULL values)
-- idx_verifikasi_history_aksi: For filtering/grouping by action type (stats, reports)
-- idx_verifikasi_history_status: For filtering by status (e.g., show all "Ditolak" actions)
-- idx_verifikasi_history_composite: For complex queries filtering by anggota + status + date range

-- Verify table created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'verifikasi_history'
ORDER BY ordinal_position;

-- Verify indexes created
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'verifikasi_history'
ORDER BY indexname;

-- Performance tips:
-- 1. Composite index (anggota_id, created_at DESC) will be used for most portal queries
-- 2. Partial index on verified_by saves space and improves performance
-- 3. Individual indexes support various admin reporting queries
-- 4. Regularly run ANALYZE verifikasi_history; to update statistics
