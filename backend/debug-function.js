const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'koperasi_merah_putih',
  password: '1',
  port: 5432,
});

async function debugFunction() {
  const client = await pool.connect();
  
  try {
    console.log('Testing manual steps from function:');
    
    // Step 1: Get kode_dusun
    console.log('\n1. Getting kode_dusun for dusun_id = 1:');
    const dusun = await client.query('SELECT id, nama, kode_dusun FROM dusun WHERE id = 1');
    console.log(dusun.rows[0]);
    
    // Step 2: Get kode_rt
    console.log('\n2. Getting kode_rt for rt_id = 29:');
    const rt = await client.query('SELECT id, nomor, kode_rt, dusun_id FROM rt WHERE id = 29');
    console.log(rt.rows[0]);
    
    // Step 3: Count anggota in this RT
    console.log('\n3. Counting anggota in RT 29:');
    const count = await client.query(`
      SELECT COUNT(*) as total
      FROM anggota
      WHERE rt_id = 29
        AND status = 'Aktif'
        AND nomor_anggota_koperasi IS NOT NULL
    `);
    console.log('Total anggota:', count.rows[0].total);
    
    // Step 4: Call function with different parameters
    console.log('\n4. Testing function with rt_id = 29:');
    const test1 = await client.query(
      "SELECT generate_nomor_anggota('warga_desa', 1, 29) as nomor"
    );
    console.log('Result:', test1.rows[0].nomor);
    
    // Get first RT for first dusun
    console.log('\n5. Getting first RT for dusun 1:');
    const firstRT = await client.query(`
      SELECT id, nomor, kode_rt 
      FROM rt 
      WHERE dusun_id = 1 
      ORDER BY id 
      LIMIT 1
    `);
    console.log('First RT:', firstRT.rows[0]);
    
    console.log('\n6. Testing function with first RT:');
    const test2 = await client.query(
      `SELECT generate_nomor_anggota('warga_desa', 1, ${firstRT.rows[0].id}) as nomor`
    );
    console.log('Result:', test2.rows[0].nomor);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugFunction();
