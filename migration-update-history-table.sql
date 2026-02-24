-- Migration: Update verifikasi_history table structure
-- Date: 2026-02-24
-- Description: Add missing columns and indexes to existing verifikasi_history table

-- ============================================
-- STEP 1: Add missing columns if not exist
-- ============================================

-- Add aksi column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'verifikasi_history' AND column_name = 'aksi'
  ) THEN
    ALTER TABLE verifikasi_history 
    ADD COLUMN aksi VARCHAR(50) NOT NULL DEFAULT 'Status Changed';
    
    RAISE NOTICE 'Column "aksi" added successfully';
  ELSE
    RAISE NOTICE 'Column "aksi" already exists';
  END IF;
END $$;

-- Ensure other columns exist with correct types
DO $$ 
BEGIN
  -- Check and add status_sebelum if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'verifikasi_history' AND column_name = 'status_sebelum'
  ) THEN
    ALTER TABLE verifikasi_history 
    ADD COLUMN status_sebelum VARCHAR(20);
    RAISE NOTICE 'Column "status_sebelum" added';
  END IF;

  -- Check and add status_sesudah if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'verifikasi_history' AND column_name = 'status_sesudah'
  ) THEN
    ALTER TABLE verifikasi_history 
    ADD COLUMN status_sesudah VARCHAR(20) NOT NULL DEFAULT 'Pending';
    RAISE NOTICE 'Column "status_sesudah" added';
  END IF;
END $$;

-- ============================================
-- STEP 2: Create indexes if not exist
-- ============================================

-- Function to create index if not exists
CREATE OR REPLACE FUNCTION create_index_if_not_exists(
  index_name TEXT, 
  table_name TEXT, 
  index_definition TEXT
) RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = table_name 
    AND indexname = index_name
  ) THEN
    EXECUTE 'CREATE INDEX ' || index_name || ' ON ' || table_name || ' ' || index_definition;
    RAISE NOTICE 'Index "%" created', index_name;
  ELSE
    RAISE NOTICE 'Index "%" already exists', index_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create all indexes
SELECT create_index_if_not_exists(
  'idx_verifikasi_history_anggota_created',
  'verifikasi_history',
  '(anggota_id, created_at DESC)'
);

SELECT create_index_if_not_exists(
  'idx_verifikasi_history_anggota_id',
  'verifikasi_history',
  '(anggota_id)'
);

SELECT create_index_if_not_exists(
  'idx_verifikasi_history_created_at',
  'verifikasi_history',
  '(created_at DESC)'
);

-- Partial index for verified_by (only non-NULL values)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'verifikasi_history'
    AND indexname = 'idx_verifikasi_history_verified_by'
  ) THEN
    CREATE INDEX idx_verifikasi_history_verified_by ON verifikasi_history(verified_by) 
    WHERE verified_by IS NOT NULL;
    RAISE NOTICE 'Partial index "idx_verifikasi_history_verified_by" created';
  ELSE
    RAISE NOTICE 'Index "idx_verifikasi_history_verified_by" already exists';
  END IF;
END $$;

SELECT create_index_if_not_exists(
  'idx_verifikasi_history_aksi',
  'verifikasi_history',
  '(aksi)'
);

SELECT create_index_if_not_exists(
  'idx_verifikasi_history_status',
  'verifikasi_history',
  '(status_sesudah)'
);

SELECT create_index_if_not_exists(
  'idx_verifikasi_history_composite',
  'verifikasi_history',
  '(anggota_id, status_sesudah, created_at DESC)'
);

-- Drop the helper function
DROP FUNCTION IF EXISTS create_index_if_not_exists(TEXT, TEXT, TEXT);

-- ============================================
-- STEP 3: Add comments
-- ============================================

COMMENT ON TABLE verifikasi_history IS 'Riwayat perubahan status verifikasi anggota';
COMMENT ON COLUMN verifikasi_history.aksi IS 'Jenis aksi: Pendaftaran Baru, Ditolak, Pengajuan Ulang, Diterima, Diaktifkan, Non Aktif';
COMMENT ON COLUMN verifikasi_history.catatan IS 'Alasan penolakan atau catatan perubahan status';

-- ============================================
-- STEP 4: Verify structure
-- ============================================

-- Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'verifikasi_history'
ORDER BY ordinal_position;

-- Show indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'verifikasi_history'
ORDER BY indexname;

-- Show table and index sizes
SELECT 
  'Table Size' as type,
  pg_size_pretty(pg_relation_size('verifikasi_history')) as size
UNION ALL
SELECT 
  'Indexes Size' as type,
  pg_size_pretty(
    pg_total_relation_size('verifikasi_history') - 
    pg_relation_size('verifikasi_history')
  ) as size
UNION ALL
SELECT 
  'Total Size' as type,
  pg_size_pretty(pg_total_relation_size('verifikasi_history')) as size;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '- Table: verifikasi_history (updated)';
  RAISE NOTICE '- Columns: All required columns verified/added';
  RAISE NOTICE '- Indexes: 7 indexes created for optimal performance';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Restart backend server';
  RAISE NOTICE '2. Test riwayat feature in portal anggota';
  RAISE NOTICE '3. Run monitoring-history-performance.sql to check performance';
END $$;
