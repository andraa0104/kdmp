-- =====================================================
-- MIGRATION: Add alasan_non_aktif column
-- Date: 2026-02-25
-- Description: Menambahkan kolom untuk menyimpan alasan
--              kenapa anggota dinonaktifkan
-- =====================================================

-- Add column alasan_non_aktif
ALTER TABLE anggota 
ADD COLUMN IF NOT EXISTS alasan_non_aktif TEXT;

-- Add comment to column
COMMENT ON COLUMN anggota.alasan_non_aktif IS 'Alasan kenapa anggota dinonaktifkan (jika status = Non Aktif)';

-- Verify column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'anggota' 
  AND column_name = 'alasan_non_aktif';

-- Sample usage (untuk testing):
-- UPDATE anggota 
-- SET status = 'Non Aktif', 
--     alasan_non_aktif = 'Tidak aktif selama 6 bulan berturut-turut'
-- WHERE id = 1;
