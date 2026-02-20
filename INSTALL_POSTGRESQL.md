# INSTALL POSTGRESQL DI LARAGON

## 📥 CARA INSTALL

### **Opsi 1: Install PostgreSQL Portable (Recommended)**

1. **Download PostgreSQL Portable**
   - Buka: https://sourceforge.net/projects/pgsqlportable/
   - Download versi terbaru (PostgreSQL 14+)

2. **Extract ke Laragon**
   - Extract file zip ke: `C:\laragon\bin\postgresql\`
   - Folder structure: `C:\laragon\bin\postgresql\postgresql-14-x64\`

3. **Konfigurasi Laragon**
   - Buka Laragon
   - Klik kanan icon Laragon > Menu > PostgreSQL > Version > pilih versi yang diinstall
   - Start PostgreSQL dari Laragon

4. **Set Password**
   ```bash
   # Default user: postgres
   # Set password pertama kali
   psql -U postgres
   \password postgres
   # Masukkan password baru (contoh: admin123)
   ```

### **Opsi 2: Install PostgreSQL Standalone**

1. **Download dari Official**
   - https://www.postgresql.org/download/windows/
   - Download installer versi 14+

2. **Install**
   - Jalankan installer
   - Port: 5432 (default)
   - Password: admin123 (atau sesuai keinginan)
   - Locale: Default

3. **Tambahkan ke PATH**
   
   **Cara Tambah PATH di Windows:**
   
   a. Tekan `Windows + R`, ketik `sysdm.cpl`, Enter
   
   b. Klik tab **Advanced** > **Environment Variables**
   
   c. Di bagian **System variables**, cari dan klik **Path** > **Edit**
   
   d. Klik **New** dan tambahkan:
      ```
      C:\Program Files\PostgreSQL\14\bin
      ```
   
   e. Klik **OK** semua dialog
   
   f. **Restart Command Prompt** atau PowerShell
   
   g. Test dengan: `psql --version`

## 🔧 VERIFIKASI INSTALASI

```bash
# Cek versi PostgreSQL
psql --version

# Login ke PostgreSQL
psql -U postgres

# Di dalam psql, cek database
\l

# Keluar dari psql
\q
```

## 📊 TOOLS MANAGEMENT (Opsional)

### **pgAdmin 4** (GUI Tool)
- Sudah include saat install PostgreSQL
- Buka: Start Menu > pgAdmin 4
- Login dengan password yang dibuat

### **DBeaver** (Alternative)
- Download: https://dbeaver.io/download/
- Support multiple database (PostgreSQL, MySQL, dll)
- Lebih ringan dari pgAdmin

## 🚀 NEXT STEP

Setelah PostgreSQL terinstall, jalankan file SQL:
```bash
psql -U postgres -f database-dusun-rt.sql
```

Atau buka pgAdmin dan import file SQL.

## ⚙️ KONFIGURASI UNTUK DEVELOPMENT

### **postgresql.conf**
```
# Lokasi: C:\Program Files\PostgreSQL\14\data\postgresql.conf
# atau di folder data PostgreSQL

# Ubah jika perlu
max_connections = 100
shared_buffers = 128MB
```

### **pg_hba.conf** (Authentication)
```
# Lokasi: C:\Program Files\PostgreSQL\14\data\pg_hba.conf

# Tambahkan untuk allow local connection
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

## 🔐 DEFAULT CREDENTIALS

```
Host: localhost
Port: 5432
User: postgres
Password: (yang kamu set saat install)
Database: postgres (default)
```

## 📝 CATATAN

- PostgreSQL service akan auto-start saat Windows boot
- Untuk stop service: `net stop postgresql-x64-14`
- Untuk start service: `net start postgresql-x64-14`
- Data disimpan di: `C:\Program Files\PostgreSQL\14\data\`
