// Create sample food data using Prisma
const prisma = require('./src/client');

async function createSampleData() {
  try {
    console.log('🗑️  Clearing existing data...');
    
    // Clear in correct order (foreign key constraints)
    await prisma.chiTietDonHang_TuyChon.deleteMany({});
    await prisma.chiTietDonHang_ChiTietCombo.deleteMany({});
    await prisma.chiTietDonHang.deleteMany({});
    await prisma.donHang.deleteMany({});
    await prisma.bienTheMonAn.deleteMany({});
    await prisma.monAn.deleteMany({});
    await prisma.loaiMonAn.deleteMany({});
    await prisma.size.deleteMany({});

    console.log('✅ Cleared');

    console.log('\n📝 Creating sample data...');

    // 1. Create food types (LoaiMonAn)
    const loaiMonAn = await prisma.loaiMonAn.createMany({
      data: [
        { TenLoaiMonAn: 'Pizza' },
        { TenLoaiMonAn: 'Món Phụ' },
        { TenLoaiMonAn: 'Tráng Miệng' },
        { TenLoaiMonAn: 'Nước Uống' },
      ],
    });
    console.log(`✅ Created ${loaiMonAn.count} food types`);

    // Get the created types
    const types = await prisma.loaiMonAn.findMany();
    const pizzaType = types[0];

    // 2. Create sizes
    const sizes = await prisma.size.createMany({
      data: [
        { TenSize: 'Nhỏ' },
        { TenSize: 'Vừa' },
        { TenSize: 'Lớn' },
      ],
    });
    console.log(`✅ Created ${sizes.count} sizes`);

    // Get the created sizes
    const sizeRecords = await prisma.size.findMany();

    // 3. Create foods (MonAn)
    const foods = await prisma.monAn.createMany({
      data: [
        {
          TenMonAn: 'Pizza Hawaiki',
          MoTa: 'Pizza với thịt lợn muối và dứa tươi',
          HinhAnh: '/images/AnhMonAn/hawaiki.jpg',
          MaLoaiMonAn: pizzaType.MaLoaiMonAn,
          TrangThai: 'Active',
          DeXuat: true,
        },
        {
          TenMonAn: 'Pizza Pepperoni',
          MoTa: 'Pizza với pepperoni đậm đà',
          HinhAnh: '/images/AnhMonAn/pepperoni.jpg',
          MaLoaiMonAn: pizzaType.MaLoaiMonAn,
          TrangThai: 'Active',
          DeXuat: false,
        },
        {
          TenMonAn: 'Pizza Seafood',
          MoTa: 'Pizza hải sản tươi ngon',
          HinhAnh: '/images/AnhMonAn/seafood.jpg',
          MaLoaiMonAn: pizzaType.MaLoaiMonAn,
          TrangThai: 'Active',
          DeXuat: true,
        },
        {
          TenMonAn: 'Pizza Margherita',
          MoTa: 'Pizza cổ điển với phô mai và cà chua',
          HinhAnh: '/images/AnhMonAn/margherita.jpg',
          MaLoaiMonAn: pizzaType.MaLoaiMonAn,
          TrangThai: 'Active',
          DeXuat: false,
        },
      ],
    });
    console.log(`✅ Created ${foods.count} foods`);

    // Get the created foods
    const foodRecords = await prisma.monAn.findMany();

    // 4. Create variants (BienTheMonAn)
    const variants = [];
    for (const food of foodRecords) {
      for (const size of sizeRecords) {
        variants.push({
          MaMonAn: food.MaMonAn,
          MaSize: size.MaSize,
          GiaBan: Math.floor(Math.random() * 200000) + 50000, // 50k - 250k
          TrangThai: 'Active',
        });
      }
    }

    const variantsCreated = await prisma.bienTheMonAn.createMany({
      data: variants,
    });
    console.log(`✅ Created ${variantsCreated.count} variants`);

    console.log('\n🎉 Sample data created successfully!\n');

    // Verify
    console.log('📊 Data verification:');
    const foodCount = await prisma.monAn.count();
    const variantCount = await prisma.bienTheMonAn.count();
    const typeCount = await prisma.loaiMonAn.count();

    console.log(`  - LoaiMonAn: ${typeCount}`);
    console.log(`  - MonAn: ${foodCount}`);
    console.log(`  - BienTheMonAn: ${variantCount}`);

    // Show samples
    console.log('\n📋 Sample foods:');
    const samples = await prisma.monAn.findMany({ take: 3 });
    samples.forEach(food => {
      console.log(`  - ${food.MaMonAn}: ${food.TenMonAn}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();
