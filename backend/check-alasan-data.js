const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'koperasi_merah_putih',
});

async function checkAnggotaData() {
  try {
    console.log('🔍 Checking anggota data with alasan_non_aktif...\n');
    
    const result = await pool.query(`
      SELECT 
        id,
        nomor_anggota_koperasi,
        nama_lengkap,
        status,
        alasan_non_aktif
      FROM anggota 
      WHERE nomor_anggota_koperasi = '201010001'
    `);
    
    if (result.rows.length > 0) {
      console.log('Data found:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('⚠️  No anggota found');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkAnggotaData();
