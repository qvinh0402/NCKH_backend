// Load data.sql into database using raw SQL execution

const fs = require('fs');
const prisma = require('./src/client');

async function loadData() {
  try {
    console.log('📂 Reading data.sql...');
    const dataSQL = fs.readFileSync('./data.sql', 'utf-8');
    
    // Split by ; but be careful about multi-line statements
    const statements = dataSQL
      .split(/;(?=[\s\n]*(?:--|$))/)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements`);
    
    let executedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < Math.min(5, statements.length); i++) {
      const stmt = statements[i];
      
      if (stmt.includes('CREATE TABLE') || stmt.includes('CREATE SEQUENCE') || 
          stmt.includes('ALTER')) {
        console.log(`⏭️  Skipping DDL statement ${i + 1}`);
        skippedCount++;
        continue;
      }
      
      if (stmt.includes('COPY') || stmt.includes('INSERT') || stmt.includes('UPDATE')) {
        try {
          console.log(`⚙️  Executing statement ${i + 1}...`);
          await prisma.$executeRawUnsafe(stmt);
          executedCount++;
        } catch (err) {
          console.log(`⚠️  Error in statement ${i + 1}: ${err.message.substring(0, 100)}`);
        }
      }
    }
    
    console.log(`\n✅ Executed: ${executedCount}, Skipped: ${skippedCount}`);
    
    // Check if data was loaded
    console.log('\n🔍 Checking loaded data...');
    
    const monAnCount = await prisma.monAn.count();
    const bienTheCount = await prisma.bienTheMonAn.count();
    
    console.log(`📊 MonAn table: ${monAnCount} records`);
    console.log(`📊 BienTheMonAn table: ${bienTheCount} records`);
    
    if (monAnCount === 0) {
      console.log('\n⚠️  No data loaded. Using direct SQL execution...');
      
      // Try to use raw SQL for COPY
      const copyMatch = dataSQL.match(/COPY public\."MonAn"[\s\S]*?\\.\n/);
      if (copyMatch) {
        console.log('Found COPY statement, but COPY not supported in Prisma');
        console.log('Consider using: cat data.sql | psql -U postgres -h localhost -d cuahangpizza');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

loadData();
