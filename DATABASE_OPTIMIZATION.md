# Database Optimization Guide

**Koperasi Merah Putih - Anggota Management System**

## 📊 Index Strategy Overview

Database ini menggunakan **strategi indexing berlapis** untuk memastikan performa optimal pada berbagai query patterns:

### 1. **Single Column Indexes**

Untuk lookup sederhana dan UNIQUE constraints:

- `nomor_anggota_koperasi` - Lookup by member number
- `nik` - Search by NIK
- `username` - Login queries
- `no_registrasi` - Registration number lookup

### 2. **Composite Indexes**

Untuk query dengan multiple filters (order matters!):

```sql
-- Status + Sort by date
idx_anggota_status_tanggal (status, tanggal_daftar DESC)
→ Optimizes: WHERE status = 'Pending' ORDER BY tanggal_daftar DESC

-- Status + Jenis Warga
idx_anggota_status_jenis_warga (status, jenis_warga)
→ Optimizes: WHERE status = 'Aktif' AND jenis_warga = 'warga_desa'

-- RT + Status (untuk counting)
idx_anggota_rt_status (rt_id, status) WHERE status = 'Aktif'
→ Optimizes: COUNT(*) WHERE rt_id = X AND status = 'Aktif'
```

### 3. **Partial Indexes**

Index hanya subset data yang sering diakses (hemat disk space):

```sql
-- Pending verifications (admin dashboard)
idx_anggota_pending → WHERE status = 'Pending'

-- Active members
idx_anggota_aktif → WHERE status = 'Aktif'

-- Waiting for payment
idx_anggota_diterima_bayar → WHERE status = 'Diterima' AND iuran_pokok_dibayar = FALSE
```

**Benefits:**

- ✅ 40-60% smaller index size
- ✅ Faster query execution for filtered data
- ✅ Less maintenance overhead on INSERT/UPDATE

### 4. **Covering Indexes (INCLUDE)**

Include frequently accessed columns to avoid table lookups:

```sql
idx_anggota_list_covering (status, tanggal_daftar DESC)
INCLUDE (id, no_registrasi, nama_lengkap, jenis_kelamin, ...)

→ SELECT * FROM anggota WHERE status = 'X'
  akan langsung ambil semua kolom dari index (NO table access!)
```

### 5. **Text Search Indexes**

Untuk ILIKE queries (case-insensitive search):

```sql
-- Standard B-tree for LOWER()
idx_anggota_nama_lower (LOWER(nama_lengkap))

-- Pattern matching
idx_anggota_nik_prefix (nik varchar_pattern_ops)
```

**Advanced (Optional - Install pg_trgm):**

```sql
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_anggota_nama_trgm ON anggota
USING gin(nama_lengkap gin_trgm_ops);
```

---

## 🚀 Query Patterns & Index Usage

### Pattern 1: Admin Dashboard - List All with Status Filter

```typescript
// Frontend Query
anggotaService.getAll({ status: 'Pending' })

// Backend SQL
SELECT * FROM anggota
WHERE status = $1
ORDER BY tanggal_daftar DESC

// Index Used: idx_anggota_status_tanggal
// Type: Index Scan
// Performance: ⚡ Fast (partial index)
```

### Pattern 2: Search by Name

```typescript
// Frontend Query
anggotaService.getAll({ search: 'Budi' })

// Backend SQL
SELECT * FROM anggota
WHERE nama_lengkap ILIKE '%Budi%'

// Index Used: idx_anggota_nama_lower (requires LOWER() in WHERE)
// Better Query:
WHERE LOWER(nama_lengkap) LIKE LOWER('%Budi%')

// Performance: ⚡ Good with B-tree, ⚡⚡ Excellent with pg_trgm
```

### Pattern 3: Login Verification

```typescript
// Backend SQL
SELECT * FROM anggota
WHERE username = $1

// Index Used: idx_anggota_username
// Type: Index Scan (UNIQUE)
// Performance: ⚡⚡ Instant (1 row max)
```

### Pattern 4: Count Members per RT

```typescript
// Backend SQL
SELECT COUNT(*) FROM anggota
WHERE rt_id = $1 AND status = 'Aktif'

// Index Used: idx_anggota_rt_status (partial)
// Type: Index-Only Scan
// Performance: ⚡⚡ Very Fast
```

### Pattern 5: Generate Nomor Anggota

```typescript
// Function: generate_nomor_anggota()
SELECT COUNT(*) + 1
FROM anggota
WHERE rt_id = $1 AND status = 'Aktif'
  AND nomor_anggota_koperasi IS NOT NULL

// Index Used: idx_anggota_rt_status
// Performance: ⚡⚡ Fast (counting on partial index)
```

### Pattern 6: Join with Dusun & RT

```typescript
// Backend SQL
SELECT a.*, d.nama as dusun_nama, r.nomor as rt_nomor
FROM anggota a
LEFT JOIN dusun d ON a.dusun_id = d.id
LEFT JOIN rt r ON a.rt_id = r.id
WHERE a.status = $1

// Index Used:
// - idx_anggota_status_tanggal (anggota scan)
// - Primary keys on dusun.id and rt.id (join)
// Type: Index Scan + Nested Loop Join
// Performance: ⚡ Good
```

---

## 📈 Performance Metrics

### Expected Query Times (1000 anggota)

| Query Type             | Without Index | With Index | Improvement  |
| ---------------------- | ------------- | ---------- | ------------ |
| Filter by status       | 15ms          | **2ms**    | 7.5x faster  |
| Search by name (ILIKE) | 25ms          | **5ms**    | 5x faster    |
| Username lookup        | 8ms           | **<1ms**   | 8x+ faster   |
| Count per RT           | 12ms          | **1ms**    | 12x faster   |
| Join with dusun/rt     | 30ms          | **8ms**    | 3.75x faster |

### Expected Query Times (10,000 anggota)

| Query Type             | Without Index | With Index | Improvement  |
| ---------------------- | ------------- | ---------- | ------------ |
| Filter by status       | 180ms         | **8ms**    | 22.5x faster |
| Search by name (ILIKE) | 320ms         | **25ms**   | 12.8x faster |
| Username lookup        | 95ms          | **<1ms**   | 95x+ faster  |
| Count per RT           | 140ms         | **3ms**    | 46x faster   |
| Join with dusun/rt     | 400ms         | **35ms**   | 11.4x faster |

---

## 🔧 Maintenance Commands

### 1. Check Index Usage Statistics

```sql
-- Melihat index mana yang paling sering digunakan
SELECT
  schemaname,
  tablename,
  indexrelname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### 2. Identify Unused Indexes

```sql
-- Index yang tidak pernah digunakan (candidate for removal)
SELECT
  schemaname,
  tablename,
  indexrelname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey';
```

### 3. Check Table & Index Sizes

```sql
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(
    pg_total_relation_size(schemaname||'.'||tablename) -
    pg_relation_size(schemaname||'.'||tablename)
  ) AS indexes_size,
  ROUND(
    100.0 * (pg_total_relation_size(schemaname||'.'||tablename) -
             pg_relation_size(schemaname||'.'||tablename)) /
    NULLIF(pg_total_relation_size(schemaname||'.'||tablename), 0),
    2
  ) AS indexes_ratio_percent
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 4. Analyze Slow Queries (Requires pg_stat_statements)

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  rows
FROM pg_stat_statements
WHERE query LIKE '%anggota%'
  AND query NOT LIKE '%pg_stat%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 5. Rebuild Bloated Indexes

```sql
-- Setelah banyak UPDATE/DELETE, rebuild index untuk compact
REINDEX TABLE anggota;
REINDEX TABLE verifikasi_history;
REINDEX TABLE pembayaran_iuran;

-- Update statistics untuk query planner
ANALYZE anggota;
ANALYZE verifikasi_history;
ANALYZE pembayaran_iuran;
```

### 6. Vacuum for Maintenance

```sql
-- Manual vacuum (biasanya auto-vacuum sudah cukup)
VACUUM ANALYZE anggota;

-- Full vacuum (locks table - gunakan saat off-peak)
VACUUM FULL ANALYZE anggota;
```

---

## 🎯 Best Practices

### ✅ DO's

1. **Use Prepared Statements** (sudah implemented di backend controller)

   ```typescript
   pool.query("SELECT * FROM anggota WHERE status = $1", [status]);
   ```

2. **Filter Early, Sort Last**

   ```sql
   -- Good ✅
   WHERE status = 'Aktif' ORDER BY tanggal_daftar DESC

   -- Bad ❌ (sorts all rows first)
   ORDER BY tanggal_daftar DESC WHERE status = 'Aktif'
   ```

3. **Use LIMIT for Pagination**

   ```sql
   SELECT * FROM anggota
   WHERE status = $1
   ORDER BY tanggal_daftar DESC
   LIMIT 20 OFFSET 0;
   ```

4. **Use EXPLAIN ANALYZE for Testing**

   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM anggota WHERE status = 'Pending';
   ```

5. **Monitor Index Hit Ratio**
   ```sql
   SELECT
     sum(idx_blks_hit) / nullif(sum(idx_blks_hit + idx_blks_read), 0) AS index_hit_ratio
   FROM pg_statio_user_indexes;
   -- Target: > 0.99 (99% cache hit)
   ```

### ❌ DON'Ts

1. **Don't Use Functions on Indexed Columns (without functional index)**

   ```sql
   -- Bad ❌ (can't use index on nik)
   WHERE UPPER(nik) = '1234567890'

   -- Good ✅ (uses idx_anggota_nik)
   WHERE nik = '1234567890'
   ```

2. **Don't Use OR with Different Columns**

   ```sql
   -- Bad ❌ (forces sequential scan)
   WHERE status = 'Aktif' OR jenis_warga = 'warga_desa'

   -- Good ✅ (use UNION if needed)
   SELECT * FROM anggota WHERE status = 'Aktif'
   UNION
   SELECT * FROM anggota WHERE jenis_warga = 'warga_desa'
   ```

3. **Don't Over-Index**
   - Indexes consume disk space
   - Slow down INSERT/UPDATE/DELETE
   - Keep only necessary indexes

4. **Don't Use SELECT \* in Production (use specific columns)**

   ```typescript
   // Bad ❌
   SELECT * FROM anggota WHERE id = $1

   // Good ✅
   SELECT id, nama_lengkap, status, nomor_anggota_koperasi
   FROM anggota WHERE id = $1
   ```

---

## 📊 Monitoring Dashboard Queries

### Daily Health Check

```sql
-- 1. Active members count
SELECT COUNT(*) FROM anggota WHERE status = 'Aktif';

-- 2. Pending verifications
SELECT COUNT(*) FROM anggota WHERE status = 'Pending';

-- 3. Today's registrations
SELECT COUNT(*) FROM anggota
WHERE DATE(tanggal_daftar) = CURRENT_DATE;

-- 4. Cache hit ratio (should be > 99%)
SELECT
  round(100.0 * sum(idx_blks_hit) /
        nullif(sum(idx_blks_hit + idx_blks_read), 0), 2)
  AS index_cache_hit_ratio
FROM pg_statio_user_indexes;

-- 5. Database size
SELECT pg_size_pretty(pg_database_size(current_database()));
```

---

## 🚨 Troubleshooting

### Problem: Query Running Slow

**Step 1: Use EXPLAIN ANALYZE**

```sql
EXPLAIN ANALYZE
SELECT * FROM anggota
WHERE status = 'Aktif'
ORDER BY tanggal_daftar DESC;
```

**Step 2: Check if Index is Used**
Look for:

- ✅ "Index Scan" or "Index Only Scan" - Good!
- ⚠️ "Bitmap Heap Scan" - OK for large result sets
- ❌ "Seq Scan" - Bad! Missing index

**Step 3: Check Statistics**

```sql
SELECT last_analyze, last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'anggota';

-- If NULL or old, run:
ANALYZE anggota;
```

### Problem: High Disk Usage

**Check Index Bloat:**

```sql
SELECT
  indexrelname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size,
  idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Solution: REINDEX**

```sql
REINDEX TABLE anggota;
```

### Problem: Slow INSERT/UPDATE

**Too many indexes!**

- Check unused indexes and DROP them
- Consider using partial indexes instead of full indexes

```sql
-- Drop unused index
DROP INDEX IF EXISTS idx_anggota_old_unused;
```

---

## 📚 Additional Resources

- [PostgreSQL Index Documentation](https://www.postgresql.org/docs/current/indexes.html)
- [Use The Index, Luke!](https://use-the-index-luke.com/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)

---

**Last Updated:** February 24, 2026  
**Database Version:** PostgreSQL 14+  
**Maintained by:** Koperasi Merah Putih Dev Team
