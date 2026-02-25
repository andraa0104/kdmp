const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'koperasi_merah_putih',
});

async function setTestNonAktif() {
  try {
    console.log('🔄 Setting test anggota to Non Aktif status...');
    
    // Update anggota dengan nomor 101010001 (Andra Aprianata)
    const result = await pool.query(`
      UPDATE anggota 
      SET status = 'Non Aktif',
          alasan_non_aktif = 'Tidak melakukan aktivitas simpan pinjam selama 12 bulan berturut-turut sesuai ketentuan koperasi.'
      WHERE nomor_anggota_koperasi = '101010001'
      RETURNING id, nama_lengkap, nomor_anggota_koperasi, status, alasan_non_aktif
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Status updated successfully!');
      console.log('Data:', result.rows[0]);
      console.log('\n📱 Silakan refresh portal anggota untuk melihat perubahannya');
    } else {
      console.log('⚠️  No anggota found with nomor 101010001');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

setTestNonAktif();
