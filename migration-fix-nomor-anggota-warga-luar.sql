-- Migration: Fix nomor anggota format untuk warga luar desa purwajaya
-- Format warga luar: 2 + 8 digit running number (contoh: 200000001)
-- Format warga desa: 1 + 2 digit dusun + 2 digit RT + 4 digit running number (contoh: 101010001)

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
  v_nomor_anggota VARCHAR(9);
  v_count INT;
BEGIN
  -- 1. Prefix (1 = warga desa, 2 = warga luar)
  IF p_jenis_warga = 'warga_desa' THEN
    v_prefix := '1';
  ELSE
    v_prefix := '2';
  END IF;
  
  -- 2. Generate nomor berdasarkan jenis warga
  IF p_jenis_warga = 'warga_luar' THEN
    -- Untuk warga luar: format 2 + 8 digit running number (contoh: 200000001)
    -- Hitung semua warga luar yang aktif
    SELECT COUNT(*) + 1 INTO v_count
    FROM anggota
    WHERE jenis_warga = 'warga_luar'
      AND status = 'Aktif'
      AND nomor_anggota_koperasi IS NOT NULL;
    
    v_nomor_anggota := v_prefix || LPAD(v_count::TEXT, 8, '0');
  ELSE
    -- Untuk warga desa: format 1 + 2 digit dusun + 2 digit RT + 4 digit running number
    -- Kode Dusun
    IF p_dusun_id IS NOT NULL THEN
      SELECT kode_dusun INTO v_kode_dusun FROM dusun WHERE id = p_dusun_id;
      v_kode_dusun := LPAD(v_kode_dusun, 2, '0');
    ELSE
      v_kode_dusun := '00';
    END IF;
    
    -- Kode RT
    IF p_rt_id IS NOT NULL THEN
      SELECT kode_rt INTO v_kode_rt FROM rt WHERE id = p_rt_id;
      v_kode_rt := LPAD(v_kode_rt, 2, '0');
    ELSE
      v_kode_rt := '00';
    END IF;
    
    -- Running Number (per RT untuk warga desa)
    SELECT COUNT(*) + 1 INTO v_count
    FROM anggota
    WHERE rt_id = p_rt_id 
      AND status = 'Aktif'
      AND nomor_anggota_koperasi IS NOT NULL;
    
    v_nomor_anggota := v_prefix || v_kode_dusun || v_kode_rt || LPAD(v_count::TEXT, 4, '0');
  END IF;
  
  RETURN v_nomor_anggota;
END;
$$ LANGUAGE plpgsql;

-- Test function untuk warga luar
-- SELECT generate_nomor_anggota('warga_luar', NULL, NULL);
-- Expected: 200000001 (atau sesuai jumlah warga luar yang sudah ada)

-- Test function untuk warga desa
-- SELECT generate_nomor_anggota('warga_desa', 1, 1);
-- Expected: 101010001 (atau sesuai dusun/RT dan jumlah anggota)
