const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'koperasi_merah_putih',
  password: '1',
  port: 5432,
});

async function checkFunction() {
  const client = await pool.connect();
  
  try {
    // Test function dengan warga_desa
    console.log('Testing generate_nomor_anggota for warga_desa...');
    const testWargaDesa = await client.query(
      "SELECT generate_nomor_anggota('warga_desa', 1, 1) as nomor"
    );
    console.log('Warga Desa result:', testWargaDesa.rows[0].nomor);
    console.log('Expected prefix: 1');
    console.log('Actual prefix:', testWargaDesa.rows[0].nomor.substring(0, 1));
    
    // Test function dengan warga_luar  
    console.log('\nTesting generate_nomor_anggota for warga_luar...');
    const testWargaLuar = await client.query(
      "SELECT generate_nomor_anggota('warga_luar', NULL, NULL) as nomor"
    );
    console.log('Warga Luar result:', testWargaLuar.rows[0].nomor);
    console.log('Expected prefix: 2');
    console.log('Actual prefix:', testWargaLuar.rows[0].nomor.substring(0, 1));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkFunction();
