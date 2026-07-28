import { 
  DonDatTour, 
  Tour, 
  NguoiDung, 
  LichKhoiHanh,
  ThanhToan,
  DanhGia
} from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import moment from 'moment';

// Lấy thống kê tổng quan
export const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Tổng doanh thu
    const totalRevenue = await DonDatTour.sum('tong_tien', {
      where: {
        trang_thai_don_hang: {
          [Op.notIn]: ['Đã hủy']
        }
      }
    });

    // Doanh thu tháng này
    const revenueThisMonth = await DonDatTour.sum('tong_tien', {
      where: {
        trang_thai_don_hang: { [Op.notIn]: ['Đã hủy'] },
        ngay_dat: { [Op.gte]: startOfMonth }
      }
    });

    // Doanh thu tháng trước
    const revenueLastMonth = await DonDatTour.sum('tong_tien', {
      where: {
        trang_thai_don_hang: { [Op.notIn]: ['Đã hủy'] },
        ngay_dat: { [Op.between]: [startOfLastMonth, endOfLastMonth] }
      }
    });

    // Số đơn hàng
    const totalBookings = await DonDatTour.count();

    // Số đơn hàng tháng này
    const bookingsThisMonth = await DonDatTour.count({
      where: {
        ngay_dat: { [Op.gte]: startOfMonth }
      }
    });

    // Số khách hàng
    const totalUsers = await NguoiDung.count();

    // Số tour đang hoạt động
    const activeTours = await Tour.count({
      where: { trang_thai: 'Đang hoạt động' }
    });

    // Tour sắp khởi hành
    const upcomingTours = await LichKhoiHanh.count({
      where: {
        ngay_khoi_hanh: { [Op.gte]: now },
        trang_thai: 'Còn chỗ'
      }
    });

    // Tính tỷ lệ tăng trưởng
    const revenueTrend = revenueLastMonth > 0 
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100 
      : 0;

    const bookingTrend = bookingsThisMonth > 0 
      ? ((bookingsThisMonth - (await DonDatTour.count({
          where: {
            ngay_dat: { [Op.between]: [startOfLastMonth, endOfLastMonth] }
          }
        }))) / (await DonDatTour.count({
          where: {
            ngay_dat: { [Op.between]: [startOfLastMonth, endOfLastMonth] }
          }
        })) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        total_revenue: totalRevenue || 0,
        revenue_trend: Math.round(revenueTrend * 100) / 100,
        total_bookings: totalBookings,
        booking_trend: Math.round(bookingTrend * 100) / 100,
        total_users: totalUsers,
        user_trend: 0,
        active_tours: activeTours,
        tour_trend: 0,
        upcoming_tours: upcomingTours
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê: ' + error.message
    });
  }
};

// Thống kê doanh thu
export const getRevenueStats = async (req, res) => {
  try {
    const { period = 'month', start_date, end_date } = req.query;

    let dateRange = {};
    let groupFormat;

    if (start_date && end_date) {
      dateRange = {
        ngay_dat: {
          [Op.between]: [new Date(start_date), new Date(end_date)]
        }
      };
      groupFormat = '%Y-%m-%d';
    } else {
      const now = new Date();
      switch (period) {
        case 'week':
          dateRange = {
            ngay_dat: {
              [Op.gte]: moment().startOf('week').toDate()
            }
          };
          groupFormat = '%Y-%m-%d';
          break;
        case 'month':
          dateRange = {
            ngay_dat: {
              [Op.gte]: moment().startOf('month').toDate()
            }
          };
          groupFormat = '%Y-%m-%d';
          break;
        case 'quarter':
          dateRange = {
            ngay_dat: {
              [Op.gte]: moment().startOf('quarter').toDate()
            }
          };
          groupFormat = '%Y-%m';
          break;
        case 'year':
          dateRange = {
            ngay_dat: {
              [Op.gte]: moment().startOf('year').toDate()
            }
          };
          groupFormat = '%Y-%m';
          break;
        default:
          dateRange = {
            ngay_dat: {
              [Op.gte]: moment().startOf('month').toDate()
            }
          };
          groupFormat = '%Y-%m-%d';
      }
    }

    const revenueData = await DonDatTour.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('ngay_dat'), groupFormat), 'date'],
        [sequelize.fn('SUM', sequelize.col('tong_tien')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('ma_don_hang')), 'count']
      ],
      where: {
        trang_thai_don_hang: { [Op.notIn]: ['Đã hủy'] },
        ...dateRange
      },
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('ngay_dat'), groupFormat)],
      order: [[sequelize.literal('date'), 'ASC']]
    });

    const total = revenueData.reduce((sum, item) => sum + parseFloat(item.dataValues.revenue || 0), 0);
    const totalOrders = revenueData.reduce((sum, item) => sum + parseInt(item.dataValues.count || 0), 0);
    const average = totalOrders > 0 ? total / totalOrders : 0;

    res.json({
      success: true,
      data: {
        labels: revenueData.map(item => item.dataValues.date),
        revenues: revenueData.map(item => parseFloat(item.dataValues.revenue || 0)),
        counts: revenueData.map(item => parseInt(item.dataValues.count || 0)),
        total: total,
        total_orders: totalOrders,
        average_per_order: average,
        growth: 0
      }
    });
  } catch (error) {
    console.error('Revenue stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê doanh thu: ' + error.message
    });
  }
};

// Top tour bán chạy - ĐÃ SỬA
export const getTopTours = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Sử dụng raw query để tránh lỗi tên bảng
    const [results] = await sequelize.query(`
      SELECT 
        t.ma_tour AS ma_tour,
        t.ten_tour AS ten_tour,
        COUNT(d.ma_don_hang) AS so_luong_dat,
        SUM(d.tong_tien) AS doanh_thu
      FROM don_dat_tour d
      INNER JOIN lich_khoi_hanh l ON d.ma_lich_khoi_hanh = l.ma_lich_khoi_hanh
      INNER JOIN tour t ON l.ma_tour = t.ma_tour
      WHERE d.trang_thai_don_hang != 'Đã hủy'
        AND d.deleted_at IS NULL
        AND l.deleted_at IS NULL
        AND t.deleted_at IS NULL
      GROUP BY t.ma_tour, t.ten_tour
      ORDER BY so_luong_dat DESC
      LIMIT ?
    `, {
      replacements: [parseInt(limit)],
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: results || []
    });
  } catch (error) {
    console.error('Top tours error:', error);
    res.json({
      success: true,
      data: []
    });
  }
};

// Thống kê hủy tour
export const getCancellationStats = async (req, res) => {
  try {
    const totalCancelled = await DonDatTour.count({
      where: { trang_thai_don_hang: 'Đã hủy' }
    });

    const totalBookings = await DonDatTour.count();
    const cancellationRate = totalBookings > 0 ? (totalCancelled / totalBookings) * 100 : 0;

    // Tổng tiền hoàn lại
    const totalRefund = await DonDatTour.sum('tong_tien', {
      where: { trang_thai_don_hang: 'Đã hủy' }
    });

    // Lý do hủy phổ biến
    const topReasons = await DonDatTour.findAll({
      attributes: [
        'ly_do_huy',
        [sequelize.fn('COUNT', sequelize.col('ma_don_hang')), 'so_luong']
      ],
      where: {
        trang_thai_don_hang: 'Đã hủy',
        ly_do_huy: { [Op.not]: null }
      },
      group: ['ly_do_huy'],
      order: [[sequelize.literal('so_luong'), 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        total_cancelled: totalCancelled,
        cancellation_rate: Math.round(cancellationRate * 100) / 100,
        total_refund: totalRefund || 0,
        top_reasons: topReasons.map(item => ({
          ly_do: item.dataValues.ly_do_huy,
          so_luong: parseInt(item.dataValues.so_luong || 0)
        }))
      }
    });
  } catch (error) {
    console.error('Cancellation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy thống kê hủy: ' + error.message
    });
  }
};

// Xuất báo cáo Excel
export const exportReport = async (req, res) => {
  try {
    const { period = 'month', start_date, end_date } = req.query;

    const bookings = await DonDatTour.findAll({
      include: [
        {
          model: LichKhoiHanh,
          as: 'lichKhoiHanh',
          include: [
            {
              model: Tour,
              as: 'tour',
              attributes: ['ten_tour', 'diem_den']
            }
          ]
        },
        {
          model: NguoiDung,
          as: 'nguoiDung',
          attributes: ['ho_ten', 'email', 'so_dien_thoai']
        }
      ],
      where: {
        trang_thai_don_hang: { [Op.notIn]: ['Đã hủy'] }
      },
      order: [['ngay_dat', 'DESC']]
    });

    const exportData = bookings.map(booking => ({
      'Mã đơn hàng': booking.ma_don_hang,
      'Tour': booking.lichKhoiHanh?.tour?.ten_tour || 'N/A',
      'Điểm đến': booking.lichKhoiHanh?.tour?.diem_den || 'N/A',
      'Ngày khởi hành': booking.lichKhoiHanh?.ngay_khoi_hanh || 'N/A',
      'Ngày đặt': booking.ngay_dat,
      'Khách hàng': booking.nguoiDung?.ho_ten || 'N/A',
      'Số điện thoại': booking.nguoiDung?.so_dien_thoai || 'N/A',
      'Email': booking.nguoiDung?.email || 'N/A',
      'Người lớn': booking.so_luong_nguoi_lon,
      'Trẻ em': booking.so_luong_tre_em || 0,
      'Tổng tiền': booking.tong_tien,
      'Trạng thái': booking.trang_thai_don_hang,
      'Thanh toán': booking.trang_thai_thanh_toan
    }));

    res.json({
      success: true,
      data: exportData,
      total: exportData.length
    });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi xuất báo cáo: ' + error.message
    });
  }
};