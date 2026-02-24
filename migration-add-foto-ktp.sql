-- Migration: Add foto_ktp column to anggota table
-- Date: 2026-02-24
-- Description: Menambahkan kolom foto_ktp untuk menyimpan foto KTP anggota dalam format base64 atau URL

-- Add foto_ktp column (TEXT untuk base64, bisa juga NULL)
ALTER TABLE anggota
ADD COLUMN foto_ktp TEXT;

-- Add comment to column
COMMENT ON COLUMN anggota.foto_ktp IS 'Foto KTP anggota dalam format base64 atau URL';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'anggota' AND column_name = 'foto_ktp';
