import { DanhGia, DonDatTour, NguoiDung, Tour } from '../models/index.js';

// Tạo đánh giá
export const createReview = async (req, res) => {
  try {
    const { ma_don_hang, so_sao, noi_dung, hinh_anh } = req.body;

    // Kiểm tra đơn hàng
    const booking = await DonDatTour.findByPk(ma_don_hang, {
      include: [{ model: Tour, as: 'tour' }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Kiểm tra quyền
    if (booking.ma_nguoi_dung !== req.user.ma_nguoi_dung) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền đánh giá đơn hàng này'
      });
    }

    // Kiểm tra đơn hàng đã hoàn thành
    if (booking.trang_thai_don_hang !== 'Đã hoàn thành') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể đánh giá tour đã hoàn thành'
      });
    }

    // Kiểm tra đã đánh giá chưa
    const existingReview = await DanhGia.findOne({
      where: { ma_don_hang }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá tour này rồi'
      });
    }

    // Tạo đánh giá
    const review = await DanhGia.create({
      ma_don_hang,
      ma_nguoi_dung: req.user.ma_nguoi_dung,
      so_sao: parseInt(so_sao),
      noi_dung: noi_dung || null,
      hinh_anh: hinh_anh || null
    });

    res.status(201).json({
      success: true,
      message: 'Đánh giá thành công',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo đánh giá: ' + error.message
    });
  }
};

// Lấy đánh giá của tour
export const getTourReviews = async (req, res) => {
  try {
    const { tourId } = req.params;

    const reviews = await DanhGia.findAll({
      include: [
        {
          model: DonDatTour,
          as: 'donDatTour',
          where: { ma_tour: parseInt(tourId) },
          include: [{ model: Tour, as: 'tour' }]
        },
        {
          model: NguoiDung,
          as: 'nguoiDung',
          attributes: ['ho_ten', 'anh_dai_dien']
        }
      ],
      order: [['ngay_danh_gia', 'DESC']]
    });

    // Tính rating trung bình
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.so_sao, 0) / totalReviews
      : 0;

    res.json({
      success: true,
      data: {
        reviews,
        total: totalReviews,
        averageRating: parseFloat(averageRating.toFixed(1))
      }
    });
  } catch (error) {
    console.error('Get tour reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy đánh giá: ' + error.message
    });
  }
};

// Lấy đánh giá của tôi
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await DanhGia.findAll({
      where: { ma_nguoi_dung: req.user.ma_nguoi_dung },
      include: [
        {
          model: DonDatTour,
          as: 'donDatTour',
          include: [{ model: Tour, as: 'tour' }]
        }
      ],
      order: [['ngay_danh_gia', 'DESC']]
    });

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy đánh giá: ' + error.message
    });
  }
};

// Cập nhật đánh giá
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { so_sao, noi_dung, hinh_anh } = req.body;

    const review = await DanhGia.findByPk(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    if (review.ma_nguoi_dung !== req.user.ma_nguoi_dung) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa đánh giá này'
      });
    }

    await review.update({
      so_sao: so_sao || review.so_sao,
      noi_dung: noi_dung || review.noi_dung,
      hinh_anh: hinh_anh || review.hinh_anh
    });

    res.json({
      success: true,
      message: 'Cập nhật đánh giá thành công',
      data: review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật đánh giá: ' + error.message
    });
  }
};

// Xóa đánh giá
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await DanhGia.findByPk(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    // Admin hoặc chủ sở hữu được xóa
    if (review.ma_nguoi_dung !== req.user.ma_nguoi_dung) {
      const user = await NguoiDung.findByPk(req.user.ma_nguoi_dung);
      if (user?.vaiTro?.ten_vai_tro !== 'Admin') {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xóa đánh giá này'
        });
      }
    }

    await review.destroy();

    res.json({
      success: true,
      message: 'Xóa đánh giá thành công'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa đánh giá: ' + error.message
    });
  }
};