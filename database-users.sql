-- =====================================================
-- TABEL USERS (ADMIN & SUPERADMIN)
-- Koperasi Merah Putih - User Management System
-- =====================================================

-- ============================================
-- TABEL ROLES
-- ============================================

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL, -- 'superadmin', 'admin', 'bendahara', 'ketua'
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABEL PERMISSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL, -- 'kelola_anggota', 'kelola_simpanan', 'kelola_pinjaman', etc.
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  module VARCHAR(50) NOT NULL, -- 'anggota', 'simpanan', 'pinjaman', 'laporan', 'settings'
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABEL ROLE_PERMISSIONS (MANY-TO-MANY)
-- ============================================

CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_role_permission UNIQUE(role_id, permission_id)
);

-- ============================================
-- TABEL USERS
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  
  -- Data Pribadi
  nama_lengkap VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  nomor_wa VARCHAR(20),
  
  -- Authentication
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- Hashed dengan bcrypt
  
  -- Role & Status
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'aktif', -- 'aktif', 'non_aktif', 'suspended'
  
  -- Avatar
  foto_profil TEXT, -- Base64 or URL
  
  -- Session Management
  last_login TIMESTAMP,
  login_count INT DEFAULT 0,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  updated_by INT REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- TABEL USER_SESSIONS (OPTIONAL - untuk tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE, -- JWT token or session ID
  ip_address VARCHAR(50),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABEL AUDIT_LOG
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout'
  module VARCHAR(50) NOT NULL, -- 'users', 'anggota', 'simpanan', etc.
  record_id INT, -- ID dari record yang di-action
  old_values JSONB, -- Data sebelum update
  new_values JSONB, -- Data setelah update
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INDEXES
-- ============================================

-- Users table indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role_status ON users(role_id, status);
CREATE INDEX idx_users_last_login ON users(last_login DESC);

-- Role permissions indexes
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Audit log indexes
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_module ON audit_log(module);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_user_module ON audit_log(user_id, module);

-- User sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert Roles
INSERT INTO roles (name, display_name, description) VALUES
  ('superadmin', 'Super Administrator', 'Akses penuh ke semua fitur sistem'),
  ('admin', 'Administrator', 'Mengelola data anggota, simpanan, dan pinjaman'),
  ('bendahara', 'Bendahara', 'Mengelola keuangan, simpanan, dan pinjaman'),
  ('ketua', 'Ketua Koperasi', 'Melihat laporan dan dashboard');

-- Insert Permissions
INSERT INTO permissions (name, display_name, module, description) VALUES
  -- Module: Users
  ('view_users', 'Lihat Pengguna', 'users', 'Melihat daftar pengguna'),
  ('create_users', 'Tambah Pengguna', 'users', 'Menambah pengguna baru'),
  ('edit_users', 'Edit Pengguna', 'users', 'Mengubah data pengguna'),
  ('delete_users', 'Hapus Pengguna', 'users', 'Menghapus pengguna'),
  
  -- Module: Roles & Permissions
  ('view_roles', 'Lihat Role', 'roles', 'Melihat daftar role'),
  ('manage_roles', 'Kelola Role', 'roles', 'Mengelola role dan permissions'),
  
  -- Module: Anggota
  ('view_anggota', 'Lihat Anggota', 'anggota', 'Melihat daftar anggota'),
  ('create_anggota', 'Tambah Anggota', 'anggota', 'Menambah anggota baru'),
  ('edit_anggota', 'Edit Anggota', 'anggota', 'Mengubah data anggota'),
  ('delete_anggota', 'Hapus Anggota', 'anggota', 'Menghapus anggota'),
  ('verify_anggota', 'Verifikasi Anggota', 'anggota', 'Menyetujui/menolak pendaftaran anggota'),
  
  -- Module: Simpanan
  ('view_simpanan', 'Lihat Simpanan', 'simpanan', 'Melihat data simpanan'),
  ('create_simpanan', 'Tambah Simpanan', 'simpanan', 'Menambah transaksi simpanan'),
  ('edit_simpanan', 'Edit Simpanan', 'simpanan', 'Mengubah data simpanan'),
  ('delete_simpanan', 'Hapus Simpanan', 'simpanan', 'Menghapus simpanan'),
  
  -- Module: Pinjaman
  ('view_pinjaman', 'Lihat Pinjaman', 'pinjaman', 'Melihat data pinjaman'),
  ('create_pinjaman', 'Tambah Pinjaman', 'pinjaman', 'Menambah pinjaman baru'),
  ('approve_pinjaman', 'Setujui Pinjaman', 'pinjaman', 'Menyetujui pengajuan pinjaman'),
  ('edit_pinjaman', 'Edit Pinjaman', 'pinjaman', 'Mengubah data pinjaman'),
  ('delete_pinjaman', 'Hapus Pinjaman', 'pinjaman', 'Menghapus pinjaman'),
  
  -- Module: Laporan
  ('view_laporan', 'Lihat Laporan', 'laporan', 'Melihat laporan keuangan'),
  ('export_laporan', 'Export Laporan', 'laporan', 'Export laporan ke Excel/PDF'),
  
  -- Module: Settings
  ('view_settings', 'Lihat Pengaturan', 'settings', 'Melihat pengaturan sistem'),
  ('edit_settings', 'Edit Pengaturan', 'settings', 'Mengubah pengaturan sistem'),
  
  -- Module: Dusun & RT
  ('manage_dusun_rt', 'Kelola Dusun & RT', 'dusun_rt', 'Mengelola data dusun dan RT'),
  
  -- Module: Audit Log
  ('view_audit_log', 'Lihat Audit Log', 'audit_log', 'Melihat riwayat aktivitas sistem');

-- Assign Permissions to Superadmin (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Assign Permissions to Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions 
WHERE name IN (
  'view_anggota', 'create_anggota', 'edit_anggota', 'verify_anggota',
  'view_simpanan', 'create_simpanan', 'edit_simpanan',
  'view_pinjaman', 'create_pinjaman', 'edit_pinjaman',
  'view_laporan', 'view_settings'
);

-- Assign Permissions to Bendahara
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions 
WHERE name IN (
  'view_anggota', 
  'view_simpanan', 'create_simpanan', 'edit_simpanan',
  'view_pinjaman', 'create_pinjaman', 'approve_pinjaman', 'edit_pinjaman',
  'view_laporan', 'export_laporan'
);

-- Assign Permissions to Ketua
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions 
WHERE name IN (
  'view_anggota',
  'view_simpanan',
  'view_pinjaman',
  'view_laporan',
  'export_laporan'
);

-- Insert Default Superadmin User
-- Password: "admin123" (hashed with bcrypt rounds=10)
-- ⚠️ IMPORTANT: Change this password after first login!
INSERT INTO users (nama_lengkap, username, password, role_id, status, email) VALUES
  ('Super Administrator', 'superadmin', '$2b$10$9QH2vtO0pnPCSE5zHnazO.X/4JHgeZHqpAgcxkT7/EckGp0Fi9GeO', 1, 'aktif', 'superadmin@koperasi.com');

-- Default Login Credentials:
-- Username: superadmin
-- Password: admin123
-- (Change immediately after first login for security!)

-- To generate new password hash, use bcrypt:
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('your_password', 10);

-- ============================================
-- VIEWS (OPTIONAL - untuk kemudahan query)
-- ============================================

-- View untuk melihat users dengan role name
CREATE OR REPLACE VIEW view_users_with_roles AS
SELECT 
  u.id,
  u.nama_lengkap,
  u.username,
  u.email,
  u.nomor_wa,
  u.status,
  r.name as role_name,
  r.display_name as role_display_name,
  u.last_login,
  u.login_count,
  u.created_at
FROM users u
JOIN roles r ON u.role_id = r.id
ORDER BY u.created_at DESC;

-- View untuk melihat permissions per user
CREATE OR REPLACE VIEW view_user_permissions AS
SELECT 
  u.id as user_id,
  u.username,
  u.nama_lengkap,
  r.name as role_name,
  p.name as permission_name,
  p.display_name as permission_display,
  p.module
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
ORDER BY u.id, p.module, p.name;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function untuk check user permission
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id INT,
  p_permission_name VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM users u
    JOIN role_permissions rp ON u.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = p_user_id 
      AND p.name = p_permission_name
      AND u.status = 'aktif'
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;

-- Function untuk get user permissions (array)
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INT)
RETURNS TEXT[] AS $$
DECLARE
  v_permissions TEXT[];
BEGIN
  SELECT ARRAY_AGG(p.name)
  INTO v_permissions
  FROM users u
  JOIN role_permissions rp ON u.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE u.id = p_user_id 
    AND u.status = 'aktif';
  
  RETURN v_permissions;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Check if user has permission
-- SELECT user_has_permission(1, 'edit_anggota');

-- Get all permissions for user
-- SELECT get_user_permissions(1);

-- Get users with roles
-- SELECT * FROM view_users_with_roles;

-- Get all permissions for specific user
-- SELECT * FROM view_user_permissions WHERE user_id = 1;

-- =====================================================
-- MAINTENANCE QUERIES
-- =====================================================

-- Count users by role
-- SELECT r.display_name, COUNT(u.id) as total_users
-- FROM roles r
-- LEFT JOIN users u ON r.id = u.role_id AND u.status = 'aktif'
-- GROUP BY r.id, r.display_name
-- ORDER BY r.id;

-- Recent login activity
-- SELECT u.username, u.nama_lengkap, u.last_login, u.login_count
-- FROM users u
-- WHERE u.last_login IS NOT NULL
-- ORDER BY u.last_login DESC
-- LIMIT 10;

-- Locked accounts
-- SELECT u.id, u.username, u.nama_lengkap, u.failed_login_attempts, u.locked_until
-- FROM users u
-- WHERE u.locked_until > NOW()
-- ORDER BY u.locked_until DESC;
