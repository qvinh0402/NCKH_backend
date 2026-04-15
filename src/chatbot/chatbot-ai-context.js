// ============================================
// CHATBOT AI CONTEXT BUILDER
// Lấy dữ liệu thực đơn từ database để tạo context cho AI
// ============================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ChatbotAIContextBuilder {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 60 * 60 * 1000; // 1 giờ
    this.cacheTimestamps = new Map();
  }

  /**
   * Lấy danh sách tất cả pizza từ database
   */
  async getAllPizzas(limit = 10) {
    try {
      const pizzas = await prisma.bienTheMonAn.findMany({
        where: {
          TrangThai: "Active",
          MonAn: {
            MaLoaiMonAn: 1 // Pizza only
          }
        },
        select: {
          MaBienThe: true,
          GiaBan: true,
          MonAn: {
            select: {
              TenMonAn: true,
              MoTa: true,
              MonAn_DanhMuc: {
                select: {
                  DanhMuc: {
                    select: { TenDanhMuc: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { GiaBan: "asc" },
        take: limit
      });

      return pizzas.map(p => ({
        name: p.MonAn.TenMonAn,
        price: Number(p.GiaBan),
        description: p.MonAn.MoTa || "Không có mô tả",
        category: p.MonAn.MonAn_DanhMuc[0]?.DanhMuc?.TenDanhMuc || "Khác"
      }));
    } catch (error) {
      console.error('[ChatbotAIContext] getAllPizzas error:', error);
      return [];
    }
  }

  /**
   * Lấy top 5 pizza rẻ nhất
   */
  async getCheapestPizzas(limit = 5) {
    try {
      const pizzas = await prisma.bienTheMonAn.findMany({
        where: {
          TrangThai: "Active",
          MonAn: {
            MaLoaiMonAn: 1
          }
        },
        select: {
          GiaBan: true,
          MonAn: {
            select: {
              TenMonAn: true,
              MonAn_DanhMuc: {
                select: {
                  DanhMuc: {
                    select: { TenDanhMuc: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { GiaBan: "asc" },
        take: limit
      });

      return pizzas.map(p => ({
        name: p.MonAn.TenMonAn,
        price: Number(p.GiaBan),
        category: p.MonAn.MonAn_DanhMuc[0]?.DanhMuc?.TenDanhMuc || "Khác"
      }));
    } catch (error) {
      console.error('[ChatbotAIContext] getCheapestPizzas error:', error);
      return [];
    }
  }

  /**
   * Lấy top 5 pizza đắt nhất
   */
  async getExpensivePizzas(limit = 5) {
    try {
      const pizzas = await prisma.bienTheMonAn.findMany({
        where: {
          TrangThai: "Active",
          MonAn: {
            MaLoaiMonAn: 1
          }
        },
        select: {
          GiaBan: true,
          MonAn: {
            select: {
              TenMonAn: true,
              MonAn_DanhMuc: {
                select: {
                  DanhMuc: {
                    select: { TenDanhMuc: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { GiaBan: "desc" },
        take: limit
      });

      return pizzas.map(p => ({
        name: p.MonAn.TenMonAn,
        price: Number(p.GiaBan),
        category: p.MonAn.MonAn_DanhMuc[0]?.DanhMuc?.TenDanhMuc || "Khác"
      }));
    } catch (error) {
      console.error('[ChatbotAIContext] getExpensivePizzas error:', error);
      return [];
    }
  }

  /**
   * Lấy danh sách tất cả món ăn (bao gồm pizza, thức uống, etc.)
   */
  async getAllDishes(limit = 15) {
    try {
      const dishes = await prisma.monAn.findMany({
        where: { TrangThai: "Active" },
        select: {
          TenMonAn: true,
          BienTheMonAn: {
            where: { TrangThai: "Active" },
            select: { GiaBan: true },
            take: 1
          },
          MonAn_DanhMuc: {
            select: {
              DanhMuc: {
                select: { TenDanhMuc: true }
              }
            }
          }
        },
        take: limit
      });

      return dishes
        .filter(d => d.BienTheMonAn.length > 0)
        .map(d => ({
          name: d.TenMonAn,
          price: Number(d.BienTheMonAn[0]?.GiaBan || 0),
          categories: d.MonAn_DanhMuc.map(c => c.DanhMuc?.TenDanhMuc).filter(Boolean)
        }));
    } catch (error) {
      console.error('[ChatbotAIContext] getAllDishes error:', error);
      return [];
    }
  }

  /**
   * Lấy danh sách các loại món
   */
  async getFoodTypes() {
    try {
      const types = await prisma.loaiMonAn.findMany({
        select: {
          MaLoaiMonAn: true,
          TenLoaiMonAn: true
        }
      });

      return types.map(t => ({
        id: t.MaLoaiMonAn,
        name: t.TenLoaiMonAn
      }));
    } catch (error) {
      console.error('[ChatbotAIContext] getFoodTypes error:', error);
      return [];
    }
  }

  /**
   * Lấy danh sách các danh mục (Heo, Hải Sản, etc.)
   */
  async getCategories() {
    try {
      const categories = await prisma.danhMuc.findMany({
        select: {
          MaDanhMuc: true,
          TenDanhMuc: true
        }
      });

      return categories.map(c => ({
        id: c.MaDanhMuc,
        name: c.TenDanhMuc
      }));
    } catch (error) {
      console.error('[ChatbotAIContext] getCategories error:', error);
      return [];
    }
  }

  /**
   * Tạo context string cho AI với menu từ database
   * Context này sẽ được thêm vào prompt để AI chỉ gợi ý món có trong thực đơn
   */
  async buildMenuContext() {
    try {
      const cacheKey = 'menuContext';
      const now = Date.now();

      // Kiểm tra cache
      if (
        this.cache.has(cacheKey) &&
        now - (this.cacheTimestamps.get(cacheKey) || 0) < this.cacheTTL
      ) {
        console.log('[ChatbotAIContext] Using cached menu context');
        return this.cache.get(cacheKey);
      }

      // Lấy dữ liệu từ database
      const [pizzas, categories, foodTypes] = await Promise.all([
        this.getAllPizzas(8),
        this.getCategories(),
        this.getFoodTypes()
      ]);

      const pizzaList = pizzas.length > 0
        ? pizzas.map((p, i) => `${i + 1}. ${p.name} (${p.category}) - ${p.price.toLocaleString('vi-VN')}đ`).join('\n')
        : "Chưa có pizza nào";

      const categoryList = categories.length > 0
        ? categories.map(c => c.name).join(", ")
        : "Không có danh mục";

      const context = `
THỰC ĐƠN SECRET PIZZA - CHỈ ĐƯỢC GỢI Ý CÁC MÓN NÀY

🍕 PIZZA CÓ SẴN:
${pizzaList}

📂 DANH MỤC PIZZA:
${categoryList}

📋 LOẠI MÓN:
${foodTypes.map(t => t.name).join(", ")}

⚠️ HƯỚNG DẪN CHO AI:
1. CHỈ gợi ý pizza/món ăn từ danh sách trên
2. KHÔNG bao giờ bịa các món không có trong menu
3. NẾU không tìm thấy món phù hợp, hãy gợi ý những pizza có sẵn
4. KHI nhắc đến giá cả, hãy sử dụng giá từ menu
5. TRÁNH bịa danh mục hoặc loại món không tồn tại
`;

      // Cache kết quả
      this.cache.set(cacheKey, context);
      this.cacheTimestamps.set(cacheKey, now);

      return context;
    } catch (error) {
      console.error('[ChatbotAIContext] buildMenuContext error:', error);
      return "SECRET PIZZA - Thực đơn giới hạn";
    }
  }

  /**
   * Xóa cache
   */
  clearCache() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }
}

module.exports = new ChatbotAIContextBuilder();
