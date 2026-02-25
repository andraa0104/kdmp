const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'koperasi_merah_putih',
  password: '1',
  port: 5432,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Running migration: migration-fix-nomor-anggota-warga-luar.sql');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'migration-fix-nomor-anggota-warga-luar.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration executed successfully');
    
    // Test function dengan warga_desa
    console.log('\nTesting generate_nomor_anggota for warga_desa...');
    const testWargaDesa = await client.query(
      "SELECT generate_nomor_anggota('warga_desa', 1, 1) as nomor"
    );
    console.log('Warga Desa result:', testWargaDesa.rows[0].nomor);
    
    // Test function dengan warga_luar  
    console.log('\nTesting generate_nomor_anggota for warga_luar...');
    const testWargaLuar = await client.query(
      "SELECT generate_nomor_anggota('warga_luar', NULL, NULL) as nomor"
    );
    console.log('Warga Luar result:', testWargaLuar.rows[0].nomor);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
