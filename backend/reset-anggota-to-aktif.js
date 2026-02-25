const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'koperasi_merah_putih',
});

async function resetToAktif() {
  try {
    console.log('🔄 Resetting anggota back to Aktif status...\n');
    
    // Reset anggota dengan nomor 201010001 (Andra Aprianata) kembali ke Aktif
    const result = await pool.query(`
      UPDATE anggota 
      SET status = 'Aktif',
          alasan_non_aktif = NULL
      WHERE nomor_anggota_koperasi = '201010001'
      RETURNING id, nama_lengkap, nomor_anggota_koperasi, status, alasan_non_aktif
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Status reset successfully!');
      console.log('Data:', result.rows[0]);
      console.log('\n📱 Sekarang coba nonaktifkan lagi melalui interface admin dengan alasan baru');
    } else {
      console.log('⚠️  No anggota found with nomor 201010001');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

resetToAktif();
