const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'koperasi_merah_putih',
});

async function checkAnggota() {
  try {
    console.log('🔍 Checking anggota with status Aktif...\n');
    
    const result = await pool.query(`
      SELECT id, nomor_anggota_koperasi, nama_lengkap, status
      FROM anggota 
      WHERE status = 'Aktif'
      ORDER BY id
      LIMIT 5
    `);
    
    if (result.rows.length > 0) {
      console.log('Found', result.rows.length, 'active members:');
      result.rows.forEach((anggota, index) => {
        console.log(`${index + 1}. ${anggota.nomor_anggota_koperasi} - ${anggota.nama_lengkap}`);
      });
      
      // Update first one
      if (result.rows[0]) {
        const first = result.rows[0];
        console.log(`\n🔄 Setting ${first.nama_lengkap} to Non Aktif...`);
        
        const updateResult = await pool.query(`
          UPDATE anggota 
          SET status = 'Non Aktif',
              alasan_non_aktif = 'Tidak melakukan aktivitas simpan pinjam selama 12 bulan berturut-turut sesuai ketentuan koperasi.'
          WHERE id = $1
          RETURNING id, nama_lengkap, nomor_anggota_koperasi, status, alasan_non_aktif
        `, [first.id]);
        
        if (updateResult.rows.length > 0) {
          console.log('✅ Status updated successfully!');
          console.log('Data:', updateResult.rows[0]);
          console.log('\n📱 Silakan login dengan username anggota ini untuk melihat tampilan Non Aktif');
        }
      }
    } else {
      console.log('⚠️  No active members found');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkAnggota();
