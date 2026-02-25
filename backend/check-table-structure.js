const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'koperasi_merah_putih',
  password: '1',
  port: 5432,
});

async function checkTables() {
  const client = await pool.connect();
  
  try {
    // Check dusun table structure
    console.log('Checking dusun table structure:');
    const dusunColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'dusun'
      ORDER BY ordinal_position
    `);
    console.log(dusunColumns.rows);
    
    // Check dusun data
    console.log('\nDusun data:');
    const dusunData = await client.query('SELECT * FROM dusun LIMIT 5');
    console.log(dusunData.rows);
    
    // Check rt table structure
    console.log('\n\nChecking rt table structure:');
    const rtColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rt'
      ORDER BY ordinal_position
    `);
    console.log(rtColumns.rows);
    
    // Check rt data
    console.log('\nRT data:');
    const rtData = await client.query('SELECT * FROM rt LIMIT 5');
    console.log(rtData.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTables();
