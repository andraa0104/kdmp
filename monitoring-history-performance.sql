-- =====================================================
-- MONITORING & MAINTENANCE QUERIES
-- Untuk tabel verifikasi_history
-- =====================================================

-- ============ 1. CHECK INDEX USAGE ============
-- Melihat index mana yang paling sering digunakan
SELECT 
  indexrelname as index_name,
  idx_scan as times_used,
  idx_tup_read as rows_read,
  idx_tup_fetch as rows_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  CASE 
    WHEN idx_scan = 0 THEN '❌ UNUSED'
    WHEN idx_scan < 100 THEN '⚠️ RARELY USED'
    WHEN idx_scan < 1000 THEN '✅ MODERATE'
    ELSE '🔥 HEAVILY USED'
  END as usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND relname = 'verifikasi_history'
ORDER BY idx_scan DESC;

-- ============ 2. TABLE & INDEX SIZES ============
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

-- ============ 3. ROW COUNT & STATISTICS ============
SELECT 
  COUNT(*) as total_rows,
  COUNT(DISTINCT anggota_id) as unique_anggota,
  COUNT(DISTINCT aksi) as unique_actions,
  AVG(LENGTH(catatan::text)) as avg_note_length,
  COUNT(*) FILTER (WHERE verified_by IS NOT NULL) as verified_count,
  COUNT(*) FILTER (WHERE verified_by IS NULL) as self_resubmit_count
FROM verifikasi_history;

-- ============ 4. MOST ACTIVE ANGGOTA ============
-- Anggota dengan riwayat terbanyak
SELECT 
  vh.anggota_id,
  a.nama_lengkap,
  COUNT(*) as history_count,
  MAX(vh.created_at) as last_activity
FROM verifikasi_history vh
JOIN anggota a ON vh.anggota_id = a.id
GROUP BY vh.anggota_id, a.nama_lengkap
ORDER BY history_count DESC
LIMIT 10;

-- ============ 5. ADMIN PERFORMANCE ============
-- Admin yang paling banyak verifikasi
SELECT 
  u.username,
  r.name as role_name,
  COUNT(*) as verifications_count,
  COUNT(*) FILTER (WHERE vh.aksi = 'Diterima') as accepted,
  COUNT(*) FILTER (WHERE vh.aksi = 'Ditolak') as rejected,
  COUNT(*) FILTER (WHERE vh.aksi = 'Diaktifkan') as activated,
  MAX(vh.created_at) as last_verification
FROM verifikasi_history vh
JOIN users u ON vh.verified_by = u.id
JOIN roles r ON u.role_id = r.id
GROUP BY u.id, u.username, r.name
ORDER BY verifications_count DESC;

-- ============ 6. ACTION STATISTICS ============
-- Distribusi jenis aksi
SELECT 
  aksi,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage,
  MIN(created_at) as first_occurrence,
  MAX(created_at) as last_occurrence
FROM verifikasi_history
GROUP BY aksi
ORDER BY count DESC;

-- ============ 7. STATUS FLOW ANALYSIS ============
-- Alur perubahan status yang paling umum
WITH status_transitions AS (
  SELECT 
    anggota_id,
    status_sebelum,
    status_sesudah,
    created_at,
    LEAD(created_at) OVER (PARTITION BY anggota_id ORDER BY created_at) as next_created_at
  FROM verifikasi_history
)
SELECT 
  COALESCE(status_sebelum, 'NULL') as from_status,
  status_sesudah as to_status,
  COUNT(*) as transition_count,
  ROUND(AVG(EXTRACT(EPOCH FROM (next_created_at - created_at)) / 86400), 2) as avg_days_to_next_status
FROM status_transitions
GROUP BY status_sebelum, status_sesudah
ORDER BY transition_count DESC;

-- ============ 8. RECENT ACTIVITY (Last 24 Hours) ============
SELECT 
  vh.id,
  vh.anggota_id,
  a.nama_lengkap,
  vh.aksi,
  vh.status_sesudah,
  vh.catatan,
  u.username as verified_by,
  vh.created_at,
  EXTRACT(EPOCH FROM (NOW() - vh.created_at)) / 3600 as hours_ago
FROM verifikasi_history vh
LEFT JOIN anggota a ON vh.anggota_id = a.id
LEFT JOIN users u ON vh.verified_by = u.id
WHERE vh.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY vh.created_at DESC;

-- ============ 9. IDENTIFY SLOW QUERIES ============
-- Check if any queries are doing sequential scans
EXPLAIN ANALYZE
SELECT vh.*, u.username 
FROM verifikasi_history vh
LEFT JOIN users u ON vh.verified_by = u.id
WHERE vh.anggota_id = 1
ORDER BY vh.created_at DESC
LIMIT 20;

-- ============ 10. INDEX HEALTH CHECK ============
-- Detect index bloat
SELECT
  indexrelname as index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  CASE 
    WHEN idx_scan = 0 AND pg_relation_size(indexrelid) > 1024*1024 THEN '⚠️ Consider dropping - unused and >1MB'
    WHEN idx_scan < 10 THEN '⚠️ Rarely used'
    ELSE '✅ Healthy'
  END as health_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND relname = 'verifikasi_history'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============ 11. MAINTENANCE COMMANDS ============
-- Run these periodically for optimal performance

-- Update table statistics (after bulk inserts)
-- ANALYZE verifikasi_history;

-- Vacuum to reclaim space (run during low traffic)
-- VACUUM ANALYZE verifikasi_history;

-- Reindex if needed (rarely required, only if bloated)
-- REINDEX TABLE verifikasi_history;

-- ============ 12. PERFORMANCE TEST ============
-- Test query performance
DO $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  duration INTERVAL;
BEGIN
  -- Test query 1: Get history by anggota_id
  start_time := clock_timestamp();
  PERFORM * FROM verifikasi_history WHERE anggota_id = 1 ORDER BY created_at DESC;
  end_time := clock_timestamp();
  duration := end_time - start_time;
  RAISE NOTICE 'Query 1 (anggota_id): % ms', EXTRACT(MILLISECONDS FROM duration);
  
  -- Test query 2: Get recent activities
  start_time := clock_timestamp();
  PERFORM * FROM verifikasi_history ORDER BY created_at DESC LIMIT 50;
  end_time := clock_timestamp();
  duration := end_time - start_time;
  RAISE NOTICE 'Query 2 (recent): % ms', EXTRACT(MILLISECONDS FROM duration);
  
  -- Test query 3: Filter by aksi
  start_time := clock_timestamp();
  PERFORM * FROM verifikasi_history WHERE aksi = 'Ditolak';
  end_time := clock_timestamp();
  duration := end_time - start_time;
  RAISE NOTICE 'Query 3 (aksi): % ms', EXTRACT(MILLISECONDS FROM duration);
END $$;

-- ============ INTERPRETATION GUIDE ============
/*
Query 1 (anggota_id): Should be <5ms with index
Query 2 (recent): Should be <10ms with index
Query 3 (aksi): Should be <20ms with index

If queries are slower:
1. Run ANALYZE verifikasi_history;
2. Check if indexes exist: \d verifikasi_history
3. Check index usage with query #1 above
4. Consider REINDEX if bloated
*/
