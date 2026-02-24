# Database Setup Guide

**Koperasi Merah Putih**

## 📋 Prerequisites

- ✅ PostgreSQL 14+ installed
- ✅ pgAdmin 4 atau psql CLI
- ✅ Database user dengan CREATE DATABASE permission

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Create Database

```sql
CREATE DATABASE koperasi_merah_putih
    WITH
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;
```

**Using psql:**

```bash
psql -U postgres -c "CREATE DATABASE koperasi_merah_putih"
```

**Using pgAdmin:**

1. Right-click "Databases" → Create → Database
2. Name: `koperasi_merah_putih`
3. Encoding: `UTF8`
4. Click Save

---

### Step 2: Run SQL Files in Order

**⚠️ IMPORTANT:** Files must be executed in this exact order!

```bash
# Navigate to project directory
cd C:\laragon\www\koperasi-merah-putih

# Run migrations in order
psql -U postgres -d koperasi_merah_putih -f database-users.sql
psql -U postgres -d koperasi_merah_putih -f database-dusun-rt.sql
psql -U postgres -d koperasi_merah_putih -f database-anggota.sql
```

**Using pgAdmin:**

1. Connect to PostgreSQL
2. Select database `koperasi_merah_putih`
3. Open Query Tool (Tools → Query Tool)
4. Open and execute each file:
   - `database-users.sql` → Execute (F5)
   - `database-dusun-rt.sql` → Execute (F5)
   - `database-anggota.sql` → Execute (F5)

---

### Step 3: Verify Setup

Run this query to check if all tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Expected 11 tables:**

1. ✅ anggota
2. ✅ audit_log
3. ✅ dusun
4. ✅ pembayaran_iuran
5. ✅ permissions
6. ✅ role_permissions
7. ✅ roles
8. ✅ rt
9. ✅ user_sessions
10. ✅ users
11. ✅ verifikasi_history

---

## 🔐 Default Login Credentials

After setup, use these credentials to login:

**Username:** `superadmin`  
**Password:** `admin123`

⚠️ **CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!**

---

## 📊 Initial Data (Seeded)

### Roles

- **superadmin** - Full system access
- **admin** - Manage members, savings, loans
- **bendahara** - Financial management
- **ketua** - View reports only

### Permissions

27 permissions across 8 modules:

- Users, Roles, Anggota, Simpanan, Pinjaman, Laporan, Settings, Dusun/RT

### Dusun & RT

- 4 Dusun (Dusun 1, 2, 3, 4)
- 8 RT (001-008)

### Users

- 1 superadmin account (you!)

---

## 🔧 Configuration

Update your backend config to connect to the database:

**File:** `backend/src/config/database.ts`

```typescript
import { Pool } from "pg";

export const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "koperasi_merah_putih",
  user: "postgres", // Your PostgreSQL user
  password: "your_password", // Your PostgreSQL password
});
```

**Or use environment variables (recommended):**

Create `.env` file in `backend/` folder:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=koperasi_merah_putih
DB_USER=postgres
DB_PASSWORD=your_password
```

Then update `database.ts`:

```typescript
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "koperasi_merah_putih",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
});
```

---

## ✅ Testing Connection

Run this test query from your backend:

```typescript
import { pool } from "./config/database";

async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✓ Database connected:", result.rows[0].now);

    const users = await pool.query("SELECT COUNT(*) FROM users");
    console.log("✓ Users count:", users.rows[0].count);

    const dusun = await pool.query("SELECT COUNT(*) FROM dusun");
    console.log("✓ Dusun count:", dusun.rows[0].count);
  } catch (err) {
    console.error("✗ Database error:", err);
  }
}

testConnection();
```

Expected output:

```
✓ Database connected: 2026-02-24T...
✓ Users count: 1
✓ Dusun count: 4
```

---

## 🛠️ Troubleshooting

### Error: "relation 'users' does not exist"

**Cause:** Tables not created or wrong execution order

**Solution:**

1. Drop database: `DROP DATABASE IF EXISTS koperasi_merah_putih;`
2. Recreate and run migrations in correct order (Step 1-2 above)

---

### Error: "password authentication failed"

**Cause:** Wrong PostgreSQL credentials

**Solution:**

1. Check your PostgreSQL username/password
2. Update `backend/src/config/database.ts` or `.env` file
3. Test connection: `psql -U postgres -d koperasi_merah_putih`

---

### Error: "database does not accept connections"

**Cause:** PostgreSQL service not running

**Solution (Windows - Laragon):**

1. Open Laragon
2. Click "Start All"
3. Check PostgreSQL status

**Solution (Manual):**

```bash
# Check status
pg_ctl status

# Start PostgreSQL
pg_ctl start -D "C:\Program Files\PostgreSQL\14\data"
```

---

### Error: "permission denied for schema public"

**Cause:** User doesn't have permission to create tables

**Solution:**

```sql
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
```

---

## 📚 Next Steps

After database setup:

1. ✅ Start backend server

   ```bash
   cd backend
   npm run dev
   ```

2. ✅ Start frontend

   ```bash
   npm run dev
   ```

3. ✅ Test registration flow
   - Open http://localhost:5173/daftar-anggota
   - Fill registration form
   - Check database: `SELECT * FROM anggota;`

4. ✅ Test admin login
   - Open http://localhost:5173/login
   - Username: `superadmin`
   - Password: `admin123`
   - Navigate to Kelola Anggota

5. ✅ Change default password!
   - Go to Account Settings
   - Update password from `admin123` to something secure

---

## 🔒 Security Checklist

After setup, secure your system:

- [ ] Change superadmin password
- [ ] Create additional admin users (don't use superadmin daily)
- [ ] Setup `.env` file with database credentials
- [ ] Add `.env` to `.gitignore`
- [ ] Setup database backups
- [ ] Enable PostgreSQL SSL (production)
- [ ] Restrict database access by IP (production)

---

## 📦 Backup & Restore

### Backup Database

```bash
pg_dump -U postgres koperasi_merah_putih > backup_20260224.sql
```

### Restore Database

```bash
# Drop existing database
psql -U postgres -c "DROP DATABASE IF EXISTS koperasi_merah_putih"

# Create new database
psql -U postgres -c "CREATE DATABASE koperasi_merah_putih"

# Restore backup
psql -U postgres -d koperasi_merah_putih < backup_20260224.sql
```

---

## 📞 Support

If you encounter issues:

1. Check logs: `backend/logs/` (if logging enabled)
2. Check PostgreSQL logs: `C:\Program Files\PostgreSQL\14\data\log\`
3. Run verification queries in DATABASE_SETUP.sql
4. Check DATABASE_OPTIMIZATION.md for performance tips

---

**Setup completed? Great!** 🎉  
You're ready to start developing the Koperasi Management System.
