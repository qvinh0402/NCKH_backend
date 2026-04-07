// Parse and execute SQL statements one by one
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function loadData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/cuahangpizza'
  });

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected');

    console.log('📂 Reading data.sql...');
    let dataSQL = fs.readFileSync(path.join(__dirname, 'data.sql'), 'utf-8');

    // Split statements more carefully
    const statements = dataSQL
      .split(/;\s*$/m) // Split on ; at end of line
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      // Skip comment-only lines
      if (!stmt || stmt.startsWith('--')) {
        skipCount++;
        continue;
      }

      try {
        // Only log progress for certain statements
        if (stmt.includes('COPY') || stmt.includes('INSERT INTO "MonAn"') || 
            stmt.includes('INSERT INTO "BienTheMonAn"') || stmt.includes('INSERT INTO "LoaiMonAn"')) {
          console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
        }

        await client.query(stmt);
        successCount++;
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          skipCount++;
        } else {
          errorCount++;
          if (errorCount <= 3) {
            console.log(`⚠️  Error in statement ${i + 1}: ${error.message.substring(0, 80)}`);
          }
        }
      }
    }

    console.log(`\n📈 Results:`);
    console.log(`  ✅ Success: ${successCount}`);
    console.log(`  ⏭️  Skipped: ${skipCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);

    // Check data
    console.log('\n🔍 Checking loaded data...');

    const loaiRes = await client.query('SELECT COUNT(*) FROM "LoaiMonAn"');
    const monAnRes = await client.query('SELECT COUNT(*) FROM "MonAn"');
    const bienTheRes = await client.query('SELECT COUNT(*) FROM "BienTheMonAn"');

    console.log(`📊 Data counts:`);
    console.log(`  - LoaiMonAn: ${loaiRes.rows[0].count}`);
    console.log(`  - MonAn: ${monAnRes.rows[0].count}`);
    console.log(`  - BienTheMonAn: ${bienTheRes.rows[0].count}`);

    if (parseInt(monAnRes.rows[0].count) > 0) {
      console.log('\n📋 Sample MonAn data:');
      const sampleRes = await client.query(
        'SELECT "MaMonAn", "TenMonAn", "TrangThai" FROM "MonAn" LIMIT 5'
      );
      sampleRes.rows.forEach(row => {
        console.log(`  - ${row.MaMonAn}: ${row.TenMonAn} (${row.TrangThai})`);
      });
    }

    if (parseInt(bienTheRes.rows[0].count) > 0) {
      console.log('\n💰 Sample BienTheMonAn data:');
      const varRes = await client.query(
        'SELECT "MaBienThe", "GiaBan", "TrangThai" FROM "BienTheMonAn" LIMIT 5'
      );
      varRes.rows.forEach(row => {
        console.log(`  - Variant ${row.MaBienThe}: ${row.GiaBan}đ (${row.TrangThai})`);
      });
    }

    console.log('\n✨ Data loading complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    await client.end();
  }
}

loadData();
