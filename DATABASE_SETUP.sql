-- =====================================================
-- MASTER DATABASE SETUP - KOPERASI MERAH PUTIH
-- Execution Order: 1. Users → 2. Dusun/RT → 3. Anggota
-- =====================================================

-- ============================================
-- 1. CREATE DATABASE
-- ============================================

-- Run this first if database doesn't exist
-- CREATE DATABASE koperasi_merah_putih
--     WITH 
--     ENCODING = 'UTF8'
--     LC_COLLATE = 'en_US.UTF-8'
--     LC_CTYPE = 'en_US.UTF-8'
--     TEMPLATE = template0;

-- Connect to database (uncomment if using psql CLI)
-- \c koperasi_merah_putih;

-- ============================================
-- 2. RUN USERS SETUP (database-users.sql)
-- ============================================

-- Run: psql -d koperasi_merah_putih -f database-users.sql
-- Or execute the entire database-users.sql content here

-- ============================================
-- 3. RUN DUSUN & RT SETUP (database-dusun-rt.sql)
-- ============================================

-- Run: psql -d koperasi_merah_putih -f database-dusun-rt.sql
-- Or execute the entire database-dusun-rt.sql content here

-- ============================================
-- 4. RUN ANGGOTA SETUP (database-anggota.sql)
-- ============================================

-- Run: psql -d koperasi_merah_putih -f database-anggota.sql
-- Or execute the entire database-anggota.sql content here

-- =====================================================
-- EXECUTION INSTRUCTIONS
-- =====================================================

/*

METHOD 1: Using psql command line (RECOMMENDED)
------------------------------------------------
1. Open terminal/command prompt
2. Navigate to project directory
3. Run commands in order:

   psql -U postgres -f database-users.sql
   psql -U postgres -d koperasi_merah_putih -f database-dusun-rt.sql
   psql -U postgres -d koperasi_merah_putih -f database-anggota.sql


METHOD 2: Using pgAdmin 4
--------------------------
1. Connect to PostgreSQL server
2. Create database 'koperasi_merah_putih' (if not exists)
3. Open Query Tool
4. Run each SQL file in order:
   - database-users.sql
   - database-dusun-rt.sql
   - database-anggota.sql


METHOD 3: Using DBeaver / DataGrip
-----------------------------------
1. Connect to PostgreSQL server
2. Create database 'koperasi_merah_putih' (if not exists)
3. Open SQL Editor
4. Execute each file in order


METHOD 4: Using Node.js script
-------------------------------
Create migration script:

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'koperasi_merah_putih',
    user: 'postgres',
    password: 'your_password'
  });

  const files = [
    'database-users.sql',
    'database-dusun-rt.sql',
    'database-anggota.sql'
  ];

  for (const file of files) {
    console.log(`Running ${file}...`);
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
    await pool.query(sql);
    console.log(`✓ ${file} completed`);
  }

  await pool.end();
  console.log('✓ All migrations completed!');
}

runMigration().catch(console.error);

*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected tables:
-- 1. anggota
-- 2. audit_log
-- 3. dusun
-- 4. pembayaran_iuran
-- 5. permissions
-- 6. role_permissions
-- 7. roles
-- 8. rt
-- 9. user_sessions
-- 10. users
-- 11. verifikasi_history

-- Check foreign key relationships
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Check indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Count records in each table
SELECT 'roles' as table_name, COUNT(*) as records FROM roles
UNION ALL
SELECT 'permissions', COUNT(*) FROM permissions
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'dusun', COUNT(*) FROM dusun
UNION ALL
SELECT 'rt', COUNT(*) FROM rt
UNION ALL
SELECT 'anggota', COUNT(*) FROM anggota;

-- Test default superadmin login
SELECT 
  u.id,
  u.username,
  u.nama_lengkap,
  r.name as role,
  u.status
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.username = 'superadmin';

-- =====================================================
-- POST-SETUP SECURITY CHECKLIST
-- =====================================================

/*

IMPORTANT: After setup, you MUST:

1. ✅ Change default superadmin password
   UPDATE users 
   SET password = $1 
   WHERE username = 'superadmin';

2. ✅ Create additional admin users
   (Don't use superadmin for daily operations)

3. ✅ Setup PostgreSQL authentication (pg_hba.conf)
   - Use md5 or scram-sha-256 for password auth
   - Restrict access by IP if needed

4. ✅ Enable connection logging
   ALTER SYSTEM SET log_connections = on;
   ALTER SYSTEM SET log_disconnections = on;

5. ✅ Regular backups
   pg_dump -U postgres koperasi_merah_putih > backup_$(date +%Y%m%d).sql

6. ✅ Monitor database size
   SELECT pg_size_pretty(pg_database_size('koperasi_merah_putih'));

7. ✅ Setup auto-vacuum (usually enabled by default)
   SHOW autovacuum;

*/
