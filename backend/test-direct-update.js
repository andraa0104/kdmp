const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'koperasi_merah_putih',
});

async function testUpdateWithAlasan() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Testing direct SQL update with alasan_non_aktif...\n');
    
    await client.query('BEGIN');
    
    // Simulate what backend should do
    const status = 'Non Aktif';
    const alasan_non_aktif = 'Test direct SQL: Tidak membayar simpanan wajib selama 6 bulan';
    const verified_by = 1;
    const id = 2; // ID Andra Aprianata
    
    const updateQuery = `
      UPDATE anggota 
      SET status = $1, 
          tanggal_verifikasi = CURRENT_TIMESTAMP, 
          verified_by = $2,
          alasan_non_aktif = $3
      WHERE id = $4
      RETURNING id, nama_lengkap, status, alasan_non_aktif
    `;
    
    const result = await client.query(updateQuery, [status, verified_by, alasan_non_aktif, id]);
    
    await client.query('COMMIT');
    
    console.log('✅ Update successful!');
    console.log('Result:', JSON.stringify(result.rows[0], null, 2));
    
    // Verify
    const verifyResult = await client.query(`
      SELECT id, nama_lengkap, status, alasan_non_aktif
      FROM anggota
      WHERE id = $1
    `, [id]);
    
    console.log('\n✅ Verification:');
    console.log(JSON.stringify(verifyResult.rows[0], null, 2));
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

testUpdateWithAlasan();
