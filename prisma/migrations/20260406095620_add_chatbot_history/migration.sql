-- CreateTable
CREATE TABLE "BienTheMonAn" (
    "MaBienThe" SERIAL NOT NULL,
    "MaMonAn" INTEGER NOT NULL,
    "MaSize" INTEGER,
    "GiaBan" DECIMAL(10,2) NOT NULL,
    "TrangThai" VARCHAR(20) DEFAULT 'Active',

    CONSTRAINT "BienTheMonAn_pkey" PRIMARY KEY ("MaBienThe")
);

-- CreateTable
CREATE TABLE "ChiTietDonHang" (
    "MaChiTiet" SERIAL NOT NULL,
    "MaDonHang" INTEGER NOT NULL,
    "MaBienThe" INTEGER NOT NULL,
    "MaDeBanh" INTEGER,
    "SoLuong" INTEGER NOT NULL DEFAULT 1,
    "DonGia" DECIMAL(10,2) NOT NULL,
    "ThanhTien" DECIMAL(10,2) NOT NULL,
    "Loai" VARCHAR(20) NOT NULL DEFAULT 'SP',
    "MaCombo" INTEGER,

    CONSTRAINT "ChiTietDonHang_pkey" PRIMARY KEY ("MaChiTiet")
);

-- CreateTable
CREATE TABLE "ChiTietDonHang_ChiTietCombo" (
    "MaCTDH_Combo" SERIAL NOT NULL,
    "MaChiTietDonHang" INTEGER NOT NULL,
    "SoLuong" INTEGER NOT NULL DEFAULT 1,
    "MaBienThe" INTEGER,
    "MaDeBanh" INTEGER,

    CONSTRAINT "ChiTietDonHang_ChiTietCombo_pkey" PRIMARY KEY ("MaCTDH_Combo")
);

-- CreateTable
CREATE TABLE "ChiTietDonHang_TuyChon" (
    "MaChiTiet" INTEGER NOT NULL,
    "MaTuyChon" INTEGER NOT NULL,
    "GiaThem" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ChiTietDonHang_TuyChon_pkey" PRIMARY KEY ("MaChiTiet","MaTuyChon")
);

-- CreateTable
CREATE TABLE "CoSo" (
    "MaCoSo" SERIAL NOT NULL,
    "TenCoSo" VARCHAR(255) NOT NULL,
    "SoDienThoai" VARCHAR(20),
    "SoNhaDuong" VARCHAR(255),
    "PhuongXa" VARCHAR(100),
    "QuanHuyen" VARCHAR(100),
    "ThanhPho" VARCHAR(100),
    "KinhDo" DECIMAL(11,8),
    "ViDo" DECIMAL(10,8),

    CONSTRAINT "CoSo_pkey" PRIMARY KEY ("MaCoSo")
);

-- CreateTable
CREATE TABLE "Combo" (
    "MaCombo" SERIAL NOT NULL,
    "TenCombo" VARCHAR(255) NOT NULL,
    "MoTa" TEXT,
    "HinhAnh" VARCHAR(255),
    "GiaCombo" DECIMAL(10,2) NOT NULL,
    "TrangThai" VARCHAR(20) DEFAULT 'Active',
    "NgayTao" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "NgayCapNhat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "ThoiGianHetHan" TIMESTAMP(6) NOT NULL DEFAULT '2999-12-31 23:59:59'::timestamp without time zone,

    CONSTRAINT "Combo_pkey" PRIMARY KEY ("MaCombo")
);

-- CreateTable
CREATE TABLE "Combo_ChiTiet" (
    "MaCTCombo" SERIAL NOT NULL,
    "MaCombo" INTEGER NOT NULL,
    "MaBienThe" INTEGER NOT NULL,
    "SoLuong" INTEGER NOT NULL DEFAULT 1,
    "MaDeBanh" INTEGER,

    CONSTRAINT "Combo_ChiTiet_pkey" PRIMARY KEY ("MaCTCombo")
);

-- CreateTable
CREATE TABLE "DanhGiaDonHang" (
    "MaDanhGiaDonHang" SERIAL NOT NULL,
    "MaDonHang" INTEGER NOT NULL,
    "SoSao" INTEGER NOT NULL,
    "BinhLuan" TEXT,
    "NgayDanhGia" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DanhGia_pkey" PRIMARY KEY ("MaDanhGiaDonHang")
);

-- CreateTable
CREATE TABLE "DanhGiaMonAn" (
    "MaDanhGiaMonAn" SERIAL NOT NULL,
    "MaMonAn" INTEGER NOT NULL,
    "MaTaiKhoan" INTEGER NOT NULL,
    "SoSao" SMALLINT NOT NULL,
    "NoiDung" TEXT,
    "NgayDanhGia" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "TrangThai" VARCHAR(20) DEFAULT 'Chờ duyệt',

    CONSTRAINT "DanhGiaMonAn_pkey" PRIMARY KEY ("MaDanhGiaMonAn")
);

-- CreateTable
CREATE TABLE "DanhMuc" (
    "MaDanhMuc" SERIAL NOT NULL,
    "TenDanhMuc" VARCHAR(100) NOT NULL,

    CONSTRAINT "DanhMuc_pkey" PRIMARY KEY ("MaDanhMuc")
);

-- CreateTable
CREATE TABLE "DeBanh" (
    "MaDeBanh" SERIAL NOT NULL,
    "TenDeBanh" VARCHAR(100) NOT NULL,

    CONSTRAINT "DeBanh_pkey" PRIMARY KEY ("MaDeBanh")
);

-- CreateTable
CREATE TABLE "DonHang" (
    "MaDonHang" SERIAL NOT NULL,
    "MaNguoiDung" INTEGER,
    "MaCoSo" INTEGER NOT NULL,
    "MaNguoiDungGiaoHang" INTEGER,
    "MaVoucher" VARCHAR(50),
    "NgayDat" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ThoiGianGiaoDuKien" TIMESTAMP(6),
    "TienTruocGiamGia" DECIMAL(10,2),
    "TienGiamGia" DECIMAL(10,2),
    "TongTien" DECIMAL(10,2) NOT NULL,
    "GhiChu" TEXT,
    "TenNguoiNhan" VARCHAR(255),
    "SoDienThoaiGiaoHang" VARCHAR(20),
    "SoNhaDuongGiaoHang" VARCHAR(255),
    "PhuongXaGiaoHang" VARCHAR(100),
    "QuanHuyenGiaoHang" VARCHAR(100),
    "ThanhPhoGiaoHang" VARCHAR(100),
    "PhiShip" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "DonHang_pkey" PRIMARY KEY ("MaDonHang")
);

-- CreateTable
CREATE TABLE "KhuyenMai" (
    "MaKhuyenMai" SERIAL NOT NULL,
    "TenKhuyenMai" VARCHAR(255) NOT NULL,
    "MoTa" TEXT,
    "KMLoai" VARCHAR(20) NOT NULL,
    "KMGiaTri" DECIMAL(10,2) NOT NULL,
    "KMBatDau" TIMESTAMP(6) NOT NULL,
    "KMKetThuc" TIMESTAMP(6) NOT NULL,
    "TrangThai" VARCHAR(20) DEFAULT 'Active',

    CONSTRAINT "KhuyenMai_pkey" PRIMARY KEY ("MaKhuyenMai")
);

-- CreateTable
CREATE TABLE "LichSuTrangThaiDonHang" (
    "MaLichSu" SERIAL NOT NULL,
    "MaDonHang" INTEGER NOT NULL,
    "TrangThai" VARCHAR(50) NOT NULL,
    "ThoiGianCapNhat" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "GhiChu" TEXT,

    CONSTRAINT "LichSuTrangThaiDonHang_pkey" PRIMARY KEY ("MaLichSu")
);

-- CreateTable
CREATE TABLE "LoaiMonAn" (
    "MaLoaiMonAn" SERIAL NOT NULL,
    "TenLoaiMonAn" VARCHAR(100) NOT NULL,

    CONSTRAINT "LoaiMonAn_pkey" PRIMARY KEY ("MaLoaiMonAn")
);

-- CreateTable
CREATE TABLE "LoaiTuyChon" (
    "MaLoaiTuyChon" SERIAL NOT NULL,
    "TenLoaiTuyChon" VARCHAR(100) NOT NULL,

    CONSTRAINT "LoaiTuyChon_pkey" PRIMARY KEY ("MaLoaiTuyChon")
);

-- CreateTable
CREATE TABLE "MonAn" (
    "MaMonAn" SERIAL NOT NULL,
    "TenMonAn" VARCHAR(255) NOT NULL,
    "MoTa" TEXT,
    "HinhAnh" VARCHAR(255),
    "MaLoaiMonAn" INTEGER NOT NULL,
    "TrangThai" VARCHAR(20) DEFAULT 'Active',
    "DeXuat" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MonAn_pkey" PRIMARY KEY ("MaMonAn")
);

-- CreateTable
CREATE TABLE "MonAn_DanhMuc" (
    "MaMonAn" INTEGER NOT NULL,
    "MaDanhMuc" INTEGER NOT NULL,

    CONSTRAINT "MonAn_DanhMuc_pkey" PRIMARY KEY ("MaMonAn","MaDanhMuc")
);

-- CreateTable
CREATE TABLE "MonAn_DeBanh" (
    "MaMonAn" INTEGER NOT NULL,
    "MaDeBanh" INTEGER NOT NULL,

    CONSTRAINT "MonAn_DeBanh_pkey" PRIMARY KEY ("MaMonAn","MaDeBanh")
);

-- CreateTable
CREATE TABLE "MonAn_KhuyenMai" (
    "MaMonAn" INTEGER NOT NULL,
    "MaKhuyenMai" INTEGER NOT NULL,

    CONSTRAINT "MonAn_KhuyenMai_pkey" PRIMARY KEY ("MaMonAn","MaKhuyenMai")
);

-- CreateTable
CREATE TABLE "MonAn_TuyChon" (
    "MaMonAn" INTEGER NOT NULL,
    "MaTuyChon" INTEGER NOT NULL,

    CONSTRAINT "MonAn_TuyChon_pkey" PRIMARY KEY ("MaMonAn","MaTuyChon")
);

-- CreateTable
CREATE TABLE "NguoiDung" (
    "MaNguoiDung" SERIAL NOT NULL,
    "MaTaiKhoan" INTEGER,
    "MaCoSo" INTEGER,
    "HoTen" VARCHAR(255) NOT NULL,
    "SoDienThoai" VARCHAR(20),
    "SoNhaDuong" VARCHAR(255),
    "PhuongXa" VARCHAR(100),
    "QuanHuyen" VARCHAR(100),
    "ThanhPho" VARCHAR(100),

    CONSTRAINT "NguoiDung_pkey" PRIMARY KEY ("MaNguoiDung")
);

-- CreateTable
CREATE TABLE "Size" (
    "MaSize" SERIAL NOT NULL,
    "TenSize" VARCHAR(50) NOT NULL,

    CONSTRAINT "Size_pkey" PRIMARY KEY ("MaSize")
);

-- CreateTable
CREATE TABLE "TaiKhoan" (
    "MaTaiKhoan" SERIAL NOT NULL,
    "Email" VARCHAR(100) NOT NULL,
    "MatKhau" VARCHAR(255) NOT NULL,
    "Role" VARCHAR(50) NOT NULL,
    "TrangThai" VARCHAR(20) NOT NULL DEFAULT 'Active',

    CONSTRAINT "TaiKhoan_pkey" PRIMARY KEY ("MaTaiKhoan")
);

-- CreateTable
CREATE TABLE "ThanhToan" (
    "MaThanhToan" SERIAL NOT NULL,
    "MaDonHang" INTEGER,
    "PhuongThuc" VARCHAR(50) NOT NULL,
    "MaGiaoDich" VARCHAR(255),
    "SoTien" DECIMAL(10,2) NOT NULL,
    "TrangThai" VARCHAR(50) NOT NULL,
    "ThoiGian" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThanhToan_pkey" PRIMARY KEY ("MaThanhToan")
);

-- CreateTable
CREATE TABLE "TuyChon" (
    "MaTuyChon" SERIAL NOT NULL,
    "TenTuyChon" VARCHAR(100) NOT NULL,
    "MaLoaiTuyChon" INTEGER NOT NULL,
    "TrangThai" VARCHAR(10) NOT NULL DEFAULT 'Active',

    CONSTRAINT "TuyChon_pkey" PRIMARY KEY ("MaTuyChon")
);

-- CreateTable
CREATE TABLE "TuyChon_Gia" (
    "MaTuyChon" INTEGER NOT NULL,
    "MaSize" INTEGER NOT NULL,
    "GiaThem" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "TuyChon_Gia_pkey" PRIMARY KEY ("MaTuyChon","MaSize")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "MaVoucher" VARCHAR(50) NOT NULL,
    "MoTa" TEXT NOT NULL,
    "LoaiGiamGia" VARCHAR(20) NOT NULL,
    "GiaTri" DECIMAL(10,2) NOT NULL,
    "DieuKienApDung" DECIMAL(10,2) DEFAULT 0,
    "NgayBatDau" TIMESTAMP(6),
    "NgayKetThuc" TIMESTAMP(6),
    "SoLuong" INTEGER,
    "TrangThai" VARCHAR(20) NOT NULL DEFAULT 'Active',

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("MaVoucher")
);

-- CreateTable
CREATE TABLE "DonHang_QuaTang" (
    "MaDonHang" INTEGER NOT NULL,
    "MaQuaTang" INTEGER NOT NULL,
    "SoLuong" INTEGER DEFAULT 1,

    CONSTRAINT "DonHang_QuaTang_pkey" PRIMARY KEY ("MaDonHang","MaQuaTang")
);

-- CreateTable
CREATE TABLE "QuaTang" (
    "MaQuaTang" SERIAL NOT NULL,
    "TenQuaTang" VARCHAR(255) NOT NULL,
    "MoTa" TEXT,
    "HinhAnh" VARCHAR(255),
    "CapDo" VARCHAR(50) NOT NULL,
    "TyLeXuatHien" DECIMAL(5,2),
    "TrangThai" VARCHAR(20) DEFAULT 'Active',

    CONSTRAINT "QuaTang_pkey" PRIMARY KEY ("MaQuaTang")
);

-- CreateTable
CREATE TABLE "AI_ReviewAnalysis" (
    "AnalysisID" SERIAL NOT NULL,
    "MaDanhGiaDonHang" INTEGER NOT NULL,
    "Sentiment" VARCHAR(20),
    "Severity" VARCHAR(20),
    "FoodIssue" TEXT,
    "DriverIssue" TEXT,
    "StoreIssue" TEXT,
    "OtherIssue" TEXT,
    "MentionLate" BOOLEAN,
    "RawJSON" JSONB,
    "NgayPhanTich" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AI_ReviewAnalysis_pkey" PRIMARY KEY ("AnalysisID")
);

-- CreateTable
CREATE TABLE "ChatHistory" (
    "MaChatHistory" SERIAL NOT NULL,
    "MaTaiKhoan" INTEGER NOT NULL,
    "LoaiTinNhan" VARCHAR(10) NOT NULL,
    "NoiDung" TEXT NOT NULL,
    "ThoiGian" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "HetHan" TIMESTAMP(3) NOT NULL,
    "TrangThai" VARCHAR(20) NOT NULL DEFAULT 'Active',

    CONSTRAINT "ChatHistory_pkey" PRIMARY KEY ("MaChatHistory")
);

-- CreateTable
CREATE TABLE "ChatConversation" (
    "MaConversation" SERIAL NOT NULL,
    "MaTaiKhoan" INTEGER NOT NULL,
    "TenConversation" VARCHAR(255),
    "GhiChuDau" TEXT,
    "NgayTao" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "NgayCapNhat" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "HetHan" TIMESTAMP(3) NOT NULL,
    "SoTinNhan" INTEGER NOT NULL DEFAULT 0,
    "TrangThai" VARCHAR(20) NOT NULL DEFAULT 'Active',

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("MaConversation")
);

-- CreateIndex
CREATE UNIQUE INDEX "Combo_ChiTiet_Unique" ON "Combo_ChiTiet"("MaCombo", "MaBienThe");

-- CreateIndex
CREATE UNIQUE INDEX "DanhGia_MaDonHang_key" ON "DanhGiaDonHang"("MaDonHang");

-- CreateIndex
CREATE UNIQUE INDEX "DanhMuc_TenDanhMuc_key" ON "DanhMuc"("TenDanhMuc");

-- CreateIndex
CREATE UNIQUE INDEX "DeBanh_TenDeBanh_key" ON "DeBanh"("TenDeBanh");

-- CreateIndex
CREATE UNIQUE INDEX "LoaiMonAn_TenLoaiMonAn_key" ON "LoaiMonAn"("TenLoaiMonAn");

-- CreateIndex
CREATE UNIQUE INDEX "LoaiTuyChon_TenLoaiTuyChon_key" ON "LoaiTuyChon"("TenLoaiTuyChon");

-- CreateIndex
CREATE UNIQUE INDEX "NguoiDung_MaTaiKhoan_key" ON "NguoiDung"("MaTaiKhoan");

-- CreateIndex
CREATE UNIQUE INDEX "NguoiDung_SoDienThoai_key" ON "NguoiDung"("SoDienThoai");

-- CreateIndex
CREATE UNIQUE INDEX "Size_TenSize_key" ON "Size"("TenSize");

-- CreateIndex
CREATE UNIQUE INDEX "TaiKhoan_Email_key" ON "TaiKhoan"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "ThanhToan_MaGiaoDich_key" ON "ThanhToan"("MaGiaoDich");

-- CreateIndex
CREATE INDEX "ChatHistory_MaTaiKhoan_idx" ON "ChatHistory"("MaTaiKhoan");

-- CreateIndex
CREATE INDEX "ChatHistory_ThoiGian_idx" ON "ChatHistory"("ThoiGian");

-- CreateIndex
CREATE INDEX "ChatHistory_HetHan_idx" ON "ChatHistory"("HetHan");

-- CreateIndex
CREATE INDEX "ChatConversation_MaTaiKhoan_idx" ON "ChatConversation"("MaTaiKhoan");

-- CreateIndex
CREATE INDEX "ChatConversation_NgayCapNhat_idx" ON "ChatConversation"("NgayCapNhat");

-- CreateIndex
CREATE INDEX "ChatConversation_HetHan_idx" ON "ChatConversation"("HetHan");

-- AddForeignKey
ALTER TABLE "BienTheMonAn" ADD CONSTRAINT "BienTheMonAn_MaMonAn_fkey" FOREIGN KEY ("MaMonAn") REFERENCES "MonAn"("MaMonAn") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "BienTheMonAn" ADD CONSTRAINT "BienTheMonAn_MaSize_fkey" FOREIGN KEY ("MaSize") REFERENCES "Size"("MaSize") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ChiTietDonHang" ADD CONSTRAINT "ChiTietDonHang_MaBienThe_fkey" FOREIGN KEY ("MaBienThe") REFERENCES "BienTheMonAn"("MaBienThe") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ChiTietDonHang" ADD CONSTRAINT "ChiTietDonHang_MaCombo_fkey" FOREIGN KEY ("MaCombo") REFERENCES "Combo"("MaCombo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ChiTietDonHang" ADD CONSTRAINT "ChiTietDonHang_MaDeBanh_fkey" FOREIGN KEY ("MaDeBanh") REFERENCES "DeBanh"("MaDeBanh") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ChiTietDonHang" ADD CONSTRAINT "ChiTietDonHang_MaDonHang_fkey" FOREIGN KEY ("MaDonHang") REFERENCES "DonHang"("MaDonHang") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ChiTietDonHang_ChiTietCombo" ADD CONSTRAINT "ChiTietDonHang_ChiTietCombo_MaBienThe_fkey" FOREIGN KEY ("MaBienThe") REFERENCES "BienTheMonAn"("MaBienThe") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ChiTietDonHang_ChiTietCombo" ADD CONSTRAINT "ChiTietDonHang_ChiTietCombo_MaChiTietDonHang_fkey" FOREIGN KEY ("MaChiTietDonHang") REFERENCES "ChiTietDonHang"("MaChiTiet") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ChiTietDonHang_ChiTietCombo" ADD CONSTRAINT "ChiTietDonHang_ChiTietCombo_MaDeBanh_fkey" FOREIGN KEY ("MaDeBanh") REFERENCES "DeBanh"("MaDeBanh") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ChiTietDonHang_TuyChon" ADD CONSTRAINT "ChiTietDonHang_TuyChon_MaChiTiet_fkey" FOREIGN KEY ("MaChiTiet") REFERENCES "ChiTietDonHang"("MaChiTiet") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ChiTietDonHang_TuyChon" ADD CONSTRAINT "ChiTietDonHang_TuyChon_MaTuyChon_fkey" FOREIGN KEY ("MaTuyChon") REFERENCES "TuyChon"("MaTuyChon") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Combo_ChiTiet" ADD CONSTRAINT "Combo_ChiTiet_MaBienThe_fkey" FOREIGN KEY ("MaBienThe") REFERENCES "BienTheMonAn"("MaBienThe") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Combo_ChiTiet" ADD CONSTRAINT "Combo_ChiTiet_MaCombo_fkey" FOREIGN KEY ("MaCombo") REFERENCES "Combo"("MaCombo") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Combo_ChiTiet" ADD CONSTRAINT "Combo_ChiTiet_MaDeBanh_fkey" FOREIGN KEY ("MaDeBanh") REFERENCES "DeBanh"("MaDeBanh") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DanhGiaDonHang" ADD CONSTRAINT "DanhGia_MaDonHang_fkey" FOREIGN KEY ("MaDonHang") REFERENCES "DonHang"("MaDonHang") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DanhGiaMonAn" ADD CONSTRAINT "DanhGiaMonAn_MaMonAn_fkey" FOREIGN KEY ("MaMonAn") REFERENCES "MonAn"("MaMonAn") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DanhGiaMonAn" ADD CONSTRAINT "DanhGiaMonAn_MaTaiKhoan_fkey" FOREIGN KEY ("MaTaiKhoan") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DonHang" ADD CONSTRAINT "DonHang_MaCoSo_fkey" FOREIGN KEY ("MaCoSo") REFERENCES "CoSo"("MaCoSo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DonHang" ADD CONSTRAINT "DonHang_MaNguoiDungGiaoHang_fkey" FOREIGN KEY ("MaNguoiDungGiaoHang") REFERENCES "NguoiDung"("MaNguoiDung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DonHang" ADD CONSTRAINT "DonHang_MaNguoiDung_fkey" FOREIGN KEY ("MaNguoiDung") REFERENCES "NguoiDung"("MaNguoiDung") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DonHang" ADD CONSTRAINT "DonHang_MaVoucher_fkey" FOREIGN KEY ("MaVoucher") REFERENCES "Voucher"("MaVoucher") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "LichSuTrangThaiDonHang" ADD CONSTRAINT "LichSuTrangThaiDonHang_MaDonHang_fkey" FOREIGN KEY ("MaDonHang") REFERENCES "DonHang"("MaDonHang") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MonAn" ADD CONSTRAINT "MonAn_MaLoaiMonAn_fkey" FOREIGN KEY ("MaLoaiMonAn") REFERENCES "LoaiMonAn"("MaLoaiMonAn") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MonAn_DanhMuc" ADD CONSTRAINT "MonAn_DanhMuc_MaDanhMuc_fkey" FOREIGN KEY ("MaDanhMuc") REFERENCES "DanhMuc"("MaDanhMuc") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MonAn_DanhMuc" ADD CONSTRAINT "MonAn_DanhMuc_MaMonAn_fkey" FOREIGN KEY ("MaMonAn") REFERENCES "MonAn"("MaMonAn") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MonAn_DeBanh" ADD CONSTRAINT "MonAn_DeBanh_MaDeBanh_fkey" FOREIGN KEY ("MaDeBanh") REFERENCES "DeBanh"("MaDeBanh") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MonAn_DeBanh" ADD CONSTRAINT "MonAn_DeBanh_MaMonAn_fkey" FOREIGN KEY ("MaMonAn") REFERENCES "MonAn"("MaMonAn") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MonAn_KhuyenMai" ADD CONSTRAINT "fk_khuyenmai" FOREIGN KEY ("MaKhuyenMai") REFERENCES "KhuyenMai"("MaKhuyenMai") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MonAn_KhuyenMai" ADD CONSTRAINT "fk_monan" FOREIGN KEY ("MaMonAn") REFERENCES "MonAn"("MaMonAn") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MonAn_TuyChon" ADD CONSTRAINT "MonAn_TuyChon_MaMonAn_fkey" FOREIGN KEY ("MaMonAn") REFERENCES "MonAn"("MaMonAn") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MonAn_TuyChon" ADD CONSTRAINT "MonAn_TuyChon_MaTuyChon_fkey" FOREIGN KEY ("MaTuyChon") REFERENCES "TuyChon"("MaTuyChon") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "NguoiDung" ADD CONSTRAINT "NguoiDung_MaCoSo_fkey" FOREIGN KEY ("MaCoSo") REFERENCES "CoSo"("MaCoSo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "NguoiDung" ADD CONSTRAINT "NguoiDung_MaTaiKhoan_fkey" FOREIGN KEY ("MaTaiKhoan") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ThanhToan" ADD CONSTRAINT "ThanhToan_MaDonHang_fkey" FOREIGN KEY ("MaDonHang") REFERENCES "DonHang"("MaDonHang") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TuyChon" ADD CONSTRAINT "TuyChon_MaLoaiTuyChon_fkey" FOREIGN KEY ("MaLoaiTuyChon") REFERENCES "LoaiTuyChon"("MaLoaiTuyChon") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TuyChon_Gia" ADD CONSTRAINT "TuyChon_Gia_MaSize_fkey" FOREIGN KEY ("MaSize") REFERENCES "Size"("MaSize") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TuyChon_Gia" ADD CONSTRAINT "TuyChon_Gia_MaTuyChon_fkey" FOREIGN KEY ("MaTuyChon") REFERENCES "TuyChon"("MaTuyChon") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DonHang_QuaTang" ADD CONSTRAINT "FK_DonHang_QuaTang_DonHang" FOREIGN KEY ("MaDonHang") REFERENCES "DonHang"("MaDonHang") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DonHang_QuaTang" ADD CONSTRAINT "FK_DonHang_QuaTang_QuaTang" FOREIGN KEY ("MaQuaTang") REFERENCES "QuaTang"("MaQuaTang") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AI_ReviewAnalysis" ADD CONSTRAINT "fk_review" FOREIGN KEY ("MaDanhGiaDonHang") REFERENCES "DanhGiaDonHang"("MaDanhGiaDonHang") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ChatHistory" ADD CONSTRAINT "ChatHistory_MaTaiKhoan_fkey" FOREIGN KEY ("MaTaiKhoan") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_MaTaiKhoan_fkey" FOREIGN KEY ("MaTaiKhoan") REFERENCES "TaiKhoan"("MaTaiKhoan") ON DELETE CASCADE ON UPDATE NO ACTION;
