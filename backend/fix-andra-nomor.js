const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'koperasi_merah_putih',
  password: '1',
  port: 5432,
});

async function fixNomorAnggota() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Fixing nomor anggota for ID 2 (Andra Aprianata)...\n');
    
    // Get current data
    const current = await client.query('SELECT * FROM anggota WHERE id = 2');
    const anggota = current.rows[0];
    console.log('Current data:');
    console.log(`  - Nama: ${anggota.nama_lengkap}`);
    console.log(`  - Jenis Warga: ${anggota.jenis_warga}`);
    console.log(`  - Nomor Lama: ${anggota.nomor_anggota_koperasi}`);
    console.log(`  - Dusun ID: ${anggota.dusun_id}`);
    console.log(`  - RT ID: ${anggota.rt_id}`);
    
    // Generate new nomor
    console.log('\nGenerating new nomor anggota...');
    const newNomor = await client.query(
      'SELECT generate_nomor_anggota($1, $2, $3) as nomor',
      [anggota.jenis_warga, anggota.dusun_id, anggota.rt_id]
    );
    
    const nomorBaru = newNomor.rows[0].nomor;
    console.log(`  - Nomor Baru: ${nomorBaru}`);
    
    // Update nomor anggota
    console.log('\nUpdating nomor anggota...');
    await client.query(
      'UPDATE anggota SET nomor_anggota_koperasi = $1 WHERE id = 2',
      [nomorBaru]
    );
    
    console.log('✅ Nomor anggota berhasil diupdate!');
    
    await client.query('COMMIT');
    
    // Verify
    console.log('\nVerifying update...');
    const verify = await client.query('SELECT id, nama_lengkap, nomor_anggota_koperasi, jenis_warga FROM anggota WHERE id = 2');
    console.log(verify.rows[0]);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixNomorAnggota();
