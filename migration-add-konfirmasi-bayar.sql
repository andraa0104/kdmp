-- Migration: Add konfirmasi bayar iuran pokok
-- Date: 2026-02-24
-- Description: Tambah field untuk calon anggota konfirmasi sudah bayar iuran pokok

-- ============================================
-- Add column konfirmasi_bayar_iuran_pokok
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'anggota' AND column_name = 'konfirmasi_bayar_iuran_pokok'
  ) THEN
    ALTER TABLE anggota 
    ADD COLUMN konfirmasi_bayar_iuran_pokok BOOLEAN DEFAULT FALSE;
    
    RAISE NOTICE 'Column "konfirmasi_bayar_iuran_pokok" added successfully';
  ELSE
    RAISE NOTICE 'Column "konfirmasi_bayar_iuran_pokok" already exists';
  END IF;
END $$;

-- Add tanggal_konfirmasi_bayar column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'anggota' AND column_name = 'tanggal_konfirmasi_bayar'
  ) THEN
    ALTER TABLE anggota 
    ADD COLUMN tanggal_konfirmasi_bayar TIMESTAMP;
    
    RAISE NOTICE 'Column "tanggal_konfirmasi_bayar" added successfully';
  ELSE
    RAISE NOTICE 'Column "tanggal_konfirmasi_bayar" already exists';
  END IF;
END $$;

-- ============================================
-- Add index for admin filter
-- ============================================

-- Index untuk filter anggota yang sudah konfirmasi bayar tapi belum diaktifkan
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'anggota'
    AND indexname = 'idx_anggota_konfirmasi_bayar'
  ) THEN
    CREATE INDEX idx_anggota_konfirmasi_bayar ON anggota(konfirmasi_bayar_iuran_pokok, status, tanggal_konfirmasi_bayar DESC)
    WHERE status = 'Diterima' AND konfirmasi_bayar_iuran_pokok = TRUE;
    
    RAISE NOTICE 'Index "idx_anggota_konfirmasi_bayar" created';
  ELSE
    RAISE NOTICE 'Index "idx_anggota_konfirmasi_bayar" already exists';
  END IF;
END $$;

-- ============================================
-- Add comments
-- ============================================

COMMENT ON COLUMN anggota.konfirmasi_bayar_iuran_pokok IS 'Flag anggota konfirmasi sudah bayar iuran pokok';
COMMENT ON COLUMN anggota.tanggal_konfirmasi_bayar IS 'Tanggal anggota konfirmasi sudah bayar';

-- ============================================
-- Verify
-- ============================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'anggota'
  AND column_name IN ('konfirmasi_bayar_iuran_pokok', 'tanggal_konfirmasi_bayar')
ORDER BY ordinal_position;

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Added columns:';
  RAISE NOTICE '- konfirmasi_bayar_iuran_pokok (BOOLEAN)';
  RAISE NOTICE '- tanggal_konfirmasi_bayar (TIMESTAMP)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Run backend server to use new fields';
END $$;
