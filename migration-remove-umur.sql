-- =====================================================
-- MIGRATION: Remove 'umur' column from anggota table
-- Reason: Umur adalah data dinamis yang bisa dihitung dari tanggal_lahir
-- Date: February 24, 2026
-- =====================================================

-- Drop umur column from anggota table
ALTER TABLE anggota DROP COLUMN IF EXISTS umur;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'anggota' 
ORDER BY ordinal_position;
