// ============================================
// CẤU HÌNH CHUNG CHO TẤT CẢ MODEL
// ============================================
export const modelConfig = {
  timestamps: true,
  underscored: true,
  paranoid: true,
  // ⭐ KHÔNG TỰ ĐỘNG TẠO INDEX
  indexes: []
};

// ⭐ HÀM HỖ TRỢ TẠO INDEX CÓ KIỂM SOÁT
export const createIndexes = (indexes) => {
  // Giới hạn tối đa 10 index
  if (indexes && indexes.length > 10) {
    console.warn('⚠️ Quá nhiều index, chỉ giữ lại 10 index đầu tiên');
    return indexes.slice(0, 10);
  }
  return indexes || [];
};