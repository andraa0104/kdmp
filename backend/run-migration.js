const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'koperasi_merah_putih',
});

async function runMigration() {
  try {
    console.log('🔄 Running migration: add alasan_non_aktif column...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'migration-add-alasan-non-aktif.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Column alasan_non_aktif added to anggota table');
    
    // Verify column exists
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'anggota' 
        AND column_name = 'alasan_non_aktif'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verification passed:', result.rows[0]);
    } else {
      console.log('⚠️  Column not found in verification');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
