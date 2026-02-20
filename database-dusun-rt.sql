-- ============================================
-- CREATE DATABASE KOPERASI MERAH PUTIH
-- ============================================

CREATE DATABASE koperasi_merah_putih
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- Connect to database
\c koperasi_merah_putih;

-- ============================================
-- TABEL DUSUN
-- ============================================

CREATE TABLE dusun (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dusun_updated_at
    BEFORE UPDATE ON dusun
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABEL RT
-- ============================================

CREATE TABLE rt (
    id SERIAL PRIMARY KEY,
    dusun_id INTEGER NOT NULL REFERENCES dusun(id) ON DELETE CASCADE,
    nomor VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_dusun_rt UNIQUE(dusun_id, nomor)
);

-- Trigger untuk auto-update updated_at
CREATE TRIGGER update_rt_updated_at
    BEFORE UPDATE ON rt
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Index untuk performa query
CREATE INDEX idx_rt_dusun_id ON rt(dusun_id);

-- ============================================
-- INSERT DATA AWAL (SEED DATA)
-- ============================================

-- Insert Dusun
INSERT INTO dusun (nama) VALUES 
    ('Dusun 1'),
    ('Dusun 2'),
    ('Dusun 3'),
    ('Dusun 4');

-- Insert RT per Dusun
INSERT INTO rt (dusun_id, nomor) VALUES
    -- Dusun 1
    (1, '001'),
    (1, '002'),
    -- Dusun 2
    (2, '003'),
    (2, '004'),
    -- Dusun 3
    (3, '005'),
    (3, '006'),
    -- Dusun 4
    (4, '007'),
    (4, '008');

-- ============================================
-- QUERY UNTUK CEK DATA
-- ============================================

-- Lihat semua dusun
SELECT * FROM dusun ORDER BY id;

-- Lihat semua RT dengan nama dusun
SELECT 
    rt.id,
    dusun.nama AS dusun,
    rt.nomor AS rt,
    rt.created_at
FROM rt
JOIN dusun ON rt.dusun_id = dusun.id
ORDER BY dusun.id, rt.nomor;

-- Lihat jumlah RT per dusun
SELECT 
    dusun.nama AS dusun,
    COUNT(rt.id) AS jumlah_rt
FROM dusun
LEFT JOIN rt ON dusun.id = rt.dusun_id
GROUP BY dusun.id, dusun.nama
ORDER BY dusun.id;
