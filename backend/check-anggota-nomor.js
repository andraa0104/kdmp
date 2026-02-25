const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'koperasi_merah_putih',
  password: '1',
  port: 5432,
});

async function checkAnggota() {
  const client = await pool.connect();
  
  try {
    console.log('Checking anggota with mismatched nomor_anggota...\n');
    
    // Find warga_desa with nomor starting with 2
    console.log('1. Warga Desa with prefix 2 (should be 1):');
    const wargaDesa = await client.query(`
      SELECT id, nama_lengkap, nomor_anggota_koperasi, jenis_warga, status, dusun_id, rt_id
      FROM anggota
      WHERE jenis_warga = 'warga_desa' 
        AND nomor_anggota_koperasi LIKE '2%'
        AND status = 'Aktif'
    `);
    console.log(`Found ${wargaDesa.rows.length} records:`);
    wargaDesa.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Nama: ${row.nama_lengkap}, Nomor: ${row.nomor_anggota_koperasi}, Dusun: ${row.dusun_id}, RT: ${row.rt_id}`);
    });
    
    // Find warga_luar with nomor starting with 1
    console.log('\n2. Warga Luar with prefix 1 (should be 2):');
    const wargaLuar = await client.query(`
      SELECT id, nama_lengkap, nomor_anggota_koperasi, jenis_warga, status, dusun_id, rt_id
      FROM anggota
      WHERE jenis_warga = 'warga_luar' 
        AND nomor_anggota_koperasi LIKE '1%'
        AND status = 'Aktif'
    `);
    console.log(`Found ${wargaLuar.rows.length} records:`);
    wargaLuar.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Nama: ${row.nama_lengkap}, Nomor: ${row.nomor_anggota_koperasi}, Dusun: ${row.dusun_id}, RT: ${row.rt_id}`);
    });
    
    // Show all Aktif anggota
    console.log('\n3. All Aktif Anggota:');
    const allAktif = await client.query(`
      SELECT id, nama_lengkap, nomor_anggota_koperasi, jenis_warga, dusun_id, rt_id
      FROM anggota
      WHERE status = 'Aktif'
      ORDER BY nomor_anggota_koperasi
    `);
    console.log(`Total: ${allAktif.rows.length} records:`);
    allAktif.rows.forEach(row => {
      console.log(`  - ${row.nomor_anggota_koperasi} | ${row.nama_lengkap} | ${row.jenis_warga} | Dusun:${row.dusun_id} RT:${row.rt_id}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAnggota();
