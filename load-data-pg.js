// Load data using pg client directly to handle COPY commands

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function loadData() {
  const client = new Client({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'cuahangpizza',
  });

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected');

    console.log('📂 Reading data.sql...');
    const dataSQL = fs.readFileSync(path.join(__dirname, 'data.sql'), 'utf-8');

    console.log('📥 Loading data...');
    const result = await client.query(dataSQL);
    console.log('✅ Data loaded successfully');

    // Check counts
    const monAnRes = await client.query('SELECT COUNT(*) FROM "MonAn"');
    const bienTheRes = await client.query('SELECT COUNT(*) FROM "BienTheMonAn"');
    const loaiRes = await client.query('SELECT COUNT(*) FROM "LoaiMonAn"');

    console.log(`\n📊 Data summary:`);
    console.log(`  - MonAn: ${monAnRes.rows[0].count} records`);
    console.log(`  - BienTheMonAn: ${bienTheRes.rows[0].count} records`);
    console.log(`  - LoaiMonAn: ${loaiRes.rows[0].count} records`);

    // Sample data
    const sampleRes = await client.query(
      'SELECT "MaMonAn", "TenMonAn", "TrangThai" FROM "MonAn" LIMIT 3'
    );
    
    if (sampleRes.rows.length > 0) {
      console.log(`\n📋 Sample MonAn data:`);
      sampleRes.rows.forEach(row => {
        console.log(`  - ${row.MaMonAn}: ${row.TenMonAn} (${row.TrangThai})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

loadData();
