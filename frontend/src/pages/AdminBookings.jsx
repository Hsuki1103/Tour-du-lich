import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { bookingsAPI } from '../api/bookings';
import { toursAPI } from '../api/tours';
import { adminAPI } from '../api/admin';
import { authAPI } from '../api/auth';
import AdminLayout from '../components/admin/AdminLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import { 
  EyeIcon, 
  CheckIcon, 
  XMarkIcon, 
  PencilIcon,
  UserIcon,
  PlusIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const AdminBookings = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // ⭐ FORM DATA
  const [formData, setFormData] = useState({
    ho_ten: '',
    email: '',
    so_dien_thoai: '',
    mat_khau: '123456',
    ma_nguoi_dung: '',
    ma_lich_khoi_hanh: '',
    so_luong_nguoi_lon: 1,
    so_luong_tre_em: 0,
    tong_tien: 0,
    tien_coc: 0,
    trang_thai_thanh_toan: 'Chưa thanh toán',
    trang_thai_don_hang: 'Chờ xác nhận'
  });

  // ⭐ STATE CHO THÔNG TIN LỊCH KHỞI HÀNH
  const [scheduleInfo, setScheduleInfo] = useState(null);

  // Fetch danh sách lịch khởi hành
  const { data: schedulesData } = useQuery(
    ['admin-schedules'], 
    () => toursAPI.getTours({ limit: 100 })
  );

  // ⭐ Tạo danh sách schedules từ dữ liệu tour
  const schedules = [];
  if (schedulesData?.data?.data?.items) {
    schedulesData.data.data.items.forEach(tour => {
      if (tour.lichKhoiHanhs) {
        tour.lichKhoiHanhs.forEach(schedule => {
          schedules.push({
            ...schedule,
            ten_tour: tour.ten_tour,
            diem_den: tour.diem_den
          });
        });
      }
    });
  }

  // ⭐ HÀM TÍNH TIỀN
  const calculateTotal = (schedule, adultCount, childCount) => {
    if (!schedule) return { tong_tien: 0, tien_coc: 0 };
    
    const giaNguoiLon = parseFloat(schedule.gia_nguoi_lon) || 0;
    const giaTreEm = parseFloat(schedule.gia_tre_em) || 0;
    
    const tongTien = (adultCount * giaNguoiLon) + (childCount * giaTreEm);
    const tienCoc = tongTien * 0.3;
    
    return { tong_tien: tongTien, tien_coc: tienCoc };
  };

  // ⭐ LẤY THÔNG TIN LỊCH KHỞI HÀNH KHI CHỌN
  useEffect(() => {
    const fetchScheduleInfo = async () => {
      if (formData.ma_lich_khoi_hanh) {
        try {
          const schedule = schedules.find(s => s.ma_lich_khoi_hanh === parseInt(formData.ma_lich_khoi_hanh));
          if (schedule) {
            setScheduleInfo(schedule);
            const { tong_tien, tien_coc } = calculateTotal(
              schedule,
              parseInt(formData.so_luong_nguoi_lon) || 0,
              parseInt(formData.so_luong_tre_em) || 0
            );
            setFormData(prev => ({
              ...prev,
              tong_tien: tong_tien,
              tien_coc: tien_coc
            }));
          }
        } catch (error) {
          console.error('Error fetching schedule:', error);
        }
      } else {
        setScheduleInfo(null);
      }
    };
    fetchScheduleInfo();
  }, [formData.ma_lich_khoi_hanh]);

  // ⭐ TỰ ĐỘNG TÍNH TIỀN KHI THAY ĐỔI SỐ LƯỢNG
  useEffect(() => {
    if (scheduleInfo) {
      const { tong_tien, tien_coc } = calculateTotal(
        scheduleInfo,
        parseInt(formData.so_luong_nguoi_lon) || 0,
        parseInt(formData.so_luong_tre_em) || 0
      );
      setFormData(prev => ({
        ...prev,
        tong_tien: tong_tien,
        tien_coc: tien_coc
      }));
    }
  }, [formData.so_luong_nguoi_lon, formData.so_luong_tre_em, scheduleInfo]);

  // Fetch bookings
  const { data, isLoading, error, refetch } = useQuery(
    ['admin-bookings', page, filter, searchTerm, showMyBookings],
    () => bookingsAPI.getAllBookings({ 
      page, 
      limit: 20, 
      trang_thai: filter || undefined,
      search: searchTerm || undefined,
      chi_cua_toi: showMyBookings ? 'true' : 'false'
    }),
    { keepPreviousData: true }
  );

  const bookings = data?.data?.data?.items || [];
  const total = data?.data?.data?.total || 0;
  const totalPages = data?.data?.data?.totalPages || 1;

  // ⭐ THỐNG KÊ ĐƠN HÀNG
  const stats = {
    total: bookings.length,
    choXacNhan: bookings.filter(b => b.trang_thai_don_hang === 'Chờ xác nhận').length,
    daXacNhan: bookings.filter(b => b.trang_thai_don_hang === 'Đã xác nhận').length,
    dangDienRa: bookings.filter(b => b.trang_thai_don_hang === 'Đang diễn ra').length,
    daHoanThanh: bookings.filter(b => b.trang_thai_don_hang === 'Đã hoàn thành').length,
    daHuy: bookings.filter(b => b.trang_thai_don_hang === 'Đã hủy').length,
    // Thống kê thanh toán
    chuaThanhToan: bookings.filter(b => b.trang_thai_thanh_toan === 'Chưa thanh toán').length,
    daDatCoc: bookings.filter(b => b.trang_thai_thanh_toan === 'Đã đặt cọc').length,
    daThanhToan: bookings.filter(b => b.trang_thai_thanh_toan === 'Đã thanh toán').length,
    // Tổng doanh thu
    tongDoanhThu: bookings.reduce((sum, b) => sum + (b.tong_tien || 0), 0),
  };

  // ⭐ MUTATIONS
  const confirmMutation = useMutation(
    (id) => bookingsAPI.confirmBooking(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-bookings']);
        alert('✅ Duyệt đơn hàng thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || '❌ Duyệt đơn thất bại');
      }
    }
  );

  const cancelMutation = useMutation(
    ({ id, ly_do }) => bookingsAPI.cancelBooking(id, { ly_do }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-bookings']);
        setShowCancelModal(false);
        setCancelReason('');
        alert('✅ Hủy đơn hàng thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || '❌ Hủy đơn thất bại');
      }
    }
  );

  const updateMutation = useMutation(
    ({ id, data }) => bookingsAPI.updateBooking(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-bookings']);
        setShowEditModal(false);
        alert('✅ Cập nhật đơn hàng thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || '❌ Cập nhật đơn hàng thất bại');
      }
    }
  );

  const addMutation = useMutation(
    (data) => bookingsAPI.createBooking(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-bookings']);
        setShowAddModal(false);
        resetForm();
        alert('✅ Thêm đơn hàng thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || '❌ Thêm đơn hàng thất bại');
      }
    }
  );

  // ⭐ TÌM HOẶC TẠO USER
  const findOrCreateUser = async (email, ho_ten, so_dien_thoai) => {
    try {
      const response = await adminAPI.getUsers({ search: email, limit: 1 });
      const users = response.data.data.items || [];
      
      if (users.length > 0) {
        return users[0].ma_nguoi_dung;
      }

      const createResponse = await authAPI.register({
        ho_ten,
        email,
        so_dien_thoai,
        mat_khau: '123456'
      });

      if (createResponse.data.success) {
        const newUserResponse = await adminAPI.getUsers({ search: email, limit: 1 });
        const newUsers = newUserResponse.data.data.items || [];
        if (newUsers.length > 0) {
          return newUsers[0].ma_nguoi_dung;
        }
      }
      throw new Error('Không thể tạo tài khoản khách hàng');
    } catch (error) {
      console.error('Find or create user error:', error);
      throw error;
    }
  };

  const handleConfirm = (id) => {
    if (window.confirm('Xác nhận duyệt đơn hàng này?')) {
      confirmMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy');
      return;
    }
    cancelMutation.mutate({ 
      id: selectedBooking?.ma_don_hang, 
      ly_do: cancelReason 
    });
  };

  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleViewDetail = (booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const handleEdit = (booking) => {
    setSelectedBooking(booking);
    const schedule = schedules.find(s => s.ma_lich_khoi_hanh === booking.ma_lich_khoi_hanh);
    setScheduleInfo(schedule || null);
    
    setFormData({
      ho_ten: booking.nguoiDung?.ho_ten || '',
      email: booking.nguoiDung?.email || '',
      so_dien_thoai: booking.nguoiDung?.so_dien_thoai || '',
      ma_nguoi_dung: booking.ma_nguoi_dung,
      ma_lich_khoi_hanh: booking.ma_lich_khoi_hanh,
      so_luong_nguoi_lon: booking.so_luong_nguoi_lon,
      so_luong_tre_em: booking.so_luong_tre_em || 0,
      tong_tien: booking.tong_tien,
      tien_coc: booking.tien_coc || 0,
      trang_thai_thanh_toan: booking.trang_thai_thanh_toan,
      trang_thai_don_hang: booking.trang_thai_don_hang,
      mat_khau: '123456'
    });
    setShowEditModal(true);
  };

  const handleAdd = () => {
    resetForm();
    setScheduleInfo(null);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      ho_ten: '',
      email: '',
      so_dien_thoai: '',
      mat_khau: '123456',
      ma_nguoi_dung: '',
      ma_lich_khoi_hanh: '',
      so_luong_nguoi_lon: 1,
      so_luong_tre_em: 0,
      tong_tien: 0,
      tien_coc: 0,
      trang_thai_thanh_toan: 'Chưa thanh toán',
      trang_thai_don_hang: 'Chờ xác nhận'
    });
    setScheduleInfo(null);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.ma_lich_khoi_hanh) {
        alert('Vui lòng chọn lịch khởi hành');
        setLoading(false);
        return;
      }

      const userId = await findOrCreateUser(
        formData.email,
        formData.ho_ten,
        formData.so_dien_thoai
      );

      const bookingData = {
        ma_nguoi_dung: userId,
        ma_lich_khoi_hanh: parseInt(formData.ma_lich_khoi_hanh),
        so_luong_nguoi_lon: parseInt(formData.so_luong_nguoi_lon) || 0,
        so_luong_tre_em: parseInt(formData.so_luong_tre_em) || 0,
        tong_tien: parseFloat(formData.tong_tien) || 0,
        trang_thai_thanh_toan: formData.trang_thai_thanh_toan,
        trang_thai_don_hang: formData.trang_thai_don_hang,
        thong_tin_khach: [{ 
          ho_ten: formData.ho_ten, 
          loai_khach: 'nguoi_lon' 
        }]
      };

      await addMutation.mutateAsync(bookingData);
    } catch (error) {
      alert(error.message || '❌ Thêm đơn hàng thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.ma_lich_khoi_hanh) {
        alert('Vui lòng chọn lịch khởi hành');
        setLoading(false);
        return;
      }

      const bookingData = {
        ma_nguoi_dung: parseInt(formData.ma_nguoi_dung),
        ma_lich_khoi_hanh: parseInt(formData.ma_lich_khoi_hanh),
        so_luong_nguoi_lon: parseInt(formData.so_luong_nguoi_lon) || 0,
        so_luong_tre_em: parseInt(formData.so_luong_tre_em) || 0,
        tong_tien: parseFloat(formData.tong_tien) || 0,
        trang_thai_thanh_toan: formData.trang_thai_thanh_toan,
        trang_thai_don_hang: formData.trang_thai_don_hang,
        thong_tin_khach: [{ 
          ho_ten: formData.ho_ten, 
          loai_khach: 'nguoi_lon' 
        }]
      };

      await updateMutation.mutateAsync({ 
        id: selectedBooking.ma_don_hang, 
        data: bookingData 
      });
    } catch (error) {
      alert(error.message || '❌ Cập nhật đơn hàng thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Quản lý đơn hàng</h1>
            <p className="text-gray-600">Xem, xử lý và quản lý các đơn hàng</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => refetch()} className="btn-secondary">Làm mới</button>
            <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              Thêm đơn hàng
            </button>
          </div>
        </div>

        {/* ⭐ THỐNG KÊ ĐƠN HÀNG */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-200">
            <div className="flex items-center justify-center mb-2">
              <ChartBarIcon className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm text-gray-500">Tổng đơn hàng</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-sm p-4 text-center border border-yellow-200">
            <div className="flex items-center justify-center mb-2">
              <ClockIcon className="w-6 h-6 text-yellow-500" />
            </div>
            <p className="text-sm text-yellow-600">Chờ xác nhận</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.choXacNhan}</p>
          </div>
          <div className="bg-green-50 rounded-xl shadow-sm p-4 text-center border border-green-200">
            <div className="flex items-center justify-center mb-2">
              <CheckCircleIcon className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm text-green-600">Đã xác nhận</p>
            <p className="text-2xl font-bold text-green-600">{stats.daXacNhan}</p>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-sm p-4 text-center border border-blue-200">
            <div className="flex items-center justify-center mb-2">
              <CurrencyDollarIcon className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm text-blue-600">Đã thanh toán</p>
            <p className="text-2xl font-bold text-blue-600">{stats.daThanhToan}</p>
          </div>
          <div className="bg-red-50 rounded-xl shadow-sm p-4 text-center border border-red-200">
            <div className="flex items-center justify-center mb-2">
              <XCircleIcon className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm text-red-600">Đã hủy</p>
            <p className="text-2xl font-bold text-red-600">{stats.daHuy}</p>
          </div>
        </div>

        {/* ⭐ THỐNG KÊ DOANH THU */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-sm p-4 text-center text-white">
            <p className="text-sm text-primary-100">Tổng doanh thu</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.tongDoanhThu)}</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-sm p-4 text-center text-white">
            <p className="text-sm text-green-100">Đã thanh toán</p>
            <p className="text-2xl font-bold">{stats.daThanhToan} đơn</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-sm p-4 text-center text-white">
            <p className="text-sm text-orange-100">Chờ thanh toán</p>
            <p className="text-2xl font-bold">{stats.chuaThanhToan} đơn</p>
          </div>
        </div>

        {/* Bộ lọc */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setShowMyBookings(!showMyBookings)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              showMyBookings ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            {showMyBookings ? '📋 Đơn hàng tôi quản lý' : '📋 Tất cả đơn hàng'}
          </button>

          <div className="flex flex-wrap gap-2">
            {['', 'Chờ xác nhận', 'Đã xác nhận', 'Đang diễn ra', 'Đã hoàn thành', 'Đã hủy'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === status ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {status || 'Tất cả'}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Tìm kiếm đơn hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field max-w-sm"
          />
        </div>

        {/* Bảng đơn hàng */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {error ? (
            <div className="p-6 text-center text-red-500">Có lỗi xảy ra khi tải danh sách đơn hàng</div>
          ) : bookings.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày KH</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NV phụ trách</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.ma_don_hang} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium">#{booking.ma_don_hang}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{booking.nguoiDung?.ho_ten}</p>
                            <p className="text-sm text-gray-500">{booking.nguoiDung?.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">{booking.lichKhoiHanh?.tour?.ten_tour || 'N/A'}</td>
                        <td className="px-6 py-4">{formatDate(booking.lichKhoiHanh?.ngay_khoi_hanh)}</td>
                        <td className="px-6 py-4 font-medium text-primary-500">
                          {formatCurrency(booking.tong_tien)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge badge-${getStatusColor(booking.trang_thai_don_hang)}`}>
                            {booking.trang_thai_don_hang}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {booking.nhanVienPhuTrach?.nguoiDung?.ho_ten ? (
                            <span className="text-sm text-gray-700">👤 {booking.nhanVienPhuTrach.nguoiDung.ho_ten}</span>
                          ) : (
                            <span className="text-sm text-gray-400">Chưa phân công</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleViewDetail(booking)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Chi tiết">
                              <EyeIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleEdit(booking)} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg" title="Sửa">
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            {booking.trang_thai_don_hang === 'Chờ xác nhận' && (
                              <button onClick={() => handleConfirm(booking.ma_don_hang)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Duyệt đơn">
                                <CheckIcon className="w-5 h-5" />
                              </button>
                            )}
                            {(booking.trang_thai_don_hang === 'Chờ xác nhận' || booking.trang_thai_don_hang === 'Đã xác nhận') && (
                              <button onClick={() => openCancelModal(booking)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Hủy">
                                <XMarkIcon className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="px-6 py-4 border-t flex justify-between items-center">
                <p className="text-sm text-gray-500">Hiển thị {bookings.length} / {total} đơn hàng</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded-lg disabled:opacity-50">Trước</button>
                  <span className="px-3 py-1">Trang {page} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded-lg disabled:opacity-50">Sau</button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500">Không có đơn hàng nào</p>
              <button onClick={handleAdd} className="btn-primary mt-4">Thêm đơn hàng đầu tiên</button>
            </div>
          )}
        </div>
      </div>

      {/* ⭐ MODAL THÊM ĐƠN HÀNG */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Thêm đơn hàng mới</h2>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              📝 Nếu khách hàng chưa có tài khoản, hệ thống sẽ tự động tạo với mật khẩu <strong>123456</strong>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Thông tin khách hàng */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Thông tin khách hàng
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                    <input
                      type="text"
                      value={formData.ho_ten}
                      onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <input
                      type="tel"
                      value={formData.so_dien_thoai}
                      onChange={(e) => setFormData({ ...formData, so_dien_thoai: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Thông tin đơn hàng */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Thông tin đơn hàng
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn lịch khởi hành *</label>
                    <select
                      value={formData.ma_lich_khoi_hanh}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, ma_lich_khoi_hanh: val });
                      }}
                      className="input-field"
                      required
                    >
                      <option value="">-- Chọn lịch khởi hành --</option>
                      {schedules.map((s) => (
                        <option key={s.ma_lich_khoi_hanh} value={s.ma_lich_khoi_hanh}>
                          {s.ten_tour} - {formatDate(s.ngay_khoi_hanh)} - {formatCurrency(s.gia_nguoi_lon)}/người lớn
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng người lớn</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.so_luong_nguoi_lon}
                        onChange={(e) => setFormData({ ...formData, so_luong_nguoi_lon: parseInt(e.target.value) || 0 })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng trẻ em</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.so_luong_tre_em}
                        onChange={(e) => setFormData({ ...formData, so_luong_tre_em: parseInt(e.target.value) || 0 })}
                        className="input-field"
                      />
                    </div>
                  </div>

                  {/* ⭐ HIỂN THỊ GIÁ TỰ TÍNH */}
                  {scheduleInfo && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Người lớn x {formData.so_luong_nguoi_lon || 0}</span>
                        <span>{formatCurrency((scheduleInfo.gia_nguoi_lon || 0) * (formData.so_luong_nguoi_lon || 0))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Trẻ em x {formData.so_luong_tre_em || 0}</span>
                        <span>{formatCurrency((scheduleInfo.gia_tre_em || 0) * (formData.so_luong_tre_em || 0))}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Tổng tiền</span>
                        <span className="text-primary-500">{formatCurrency(formData.tong_tien || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Tiền cọc (30%)</span>
                        <span>{formatCurrency(formData.tien_coc || 0)}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái đơn</label>
                      <select
                        value={formData.trang_thai_don_hang}
                        onChange={(e) => setFormData({ ...formData, trang_thai_don_hang: e.target.value })}
                        className="input-field"
                      >
                        <option value="Chờ xác nhận">Chờ xác nhận</option>
                        <option value="Đã xác nhận">Đã xác nhận</option>
                        <option value="Đang diễn ra">Đang diễn ra</option>
                        <option value="Đã hoàn thành">Đã hoàn thành</option>
                        <option value="Đã hủy">Đã hủy</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái thanh toán</label>
                      <select
                        value={formData.trang_thai_thanh_toan}
                        onChange={(e) => setFormData({ ...formData, trang_thai_thanh_toan: e.target.value })}
                        className="input-field"
                      >
                        <option value="Chưa thanh toán">Chưa thanh toán</option>
                        <option value="Đã đặt cọc">Đã đặt cọc</option>
                        <option value="Đã thanh toán">Đã thanh toán</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Đang xử lý...' : 'Thêm đơn hàng'}
                </button>
                <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="btn-secondary flex-1">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⭐ MODAL SỬA ĐƠN HÀNG */}
      {showEditModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Sửa đơn hàng #{selectedBooking.ma_don_hang}</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Thông tin khách hàng */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Thông tin khách hàng
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                    <input type="text" value={formData.ho_ten} className="input-field bg-gray-100" readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={formData.email} className="input-field bg-gray-100" readOnly />
                  </div>
                </div>
              </div>

              {/* Thông tin đơn hàng */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Thông tin đơn hàng
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lịch khởi hành *</label>
                    <select
                      value={formData.ma_lich_khoi_hanh}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, ma_lich_khoi_hanh: val });
                      }}
                      className="input-field"
                      required
                    >
                      {schedules.map((s) => (
                        <option key={s.ma_lich_khoi_hanh} value={s.ma_lich_khoi_hanh}>
                          {s.ten_tour} - {formatDate(s.ngay_khoi_hanh)} - {formatCurrency(s.gia_nguoi_lon)}/người lớn
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Người lớn</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.so_luong_nguoi_lon}
                        onChange={(e) => setFormData({ ...formData, so_luong_nguoi_lon: parseInt(e.target.value) || 0 })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trẻ em</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.so_luong_tre_em}
                        onChange={(e) => setFormData({ ...formData, so_luong_tre_em: parseInt(e.target.value) || 0 })}
                        className="input-field"
                      />
                    </div>
                  </div>

                  {/* ⭐ HIỂN THỊ GIÁ TỰ TÍNH */}
                  {scheduleInfo && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Người lớn x {formData.so_luong_nguoi_lon || 0}</span>
                        <span>{formatCurrency((scheduleInfo.gia_nguoi_lon || 0) * (formData.so_luong_nguoi_lon || 0))}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Trẻ em x {formData.so_luong_tre_em || 0}</span>
                        <span>{formatCurrency((scheduleInfo.gia_tre_em || 0) * (formData.so_luong_tre_em || 0))}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Tổng tiền</span>
                        <span className="text-primary-500">{formatCurrency(formData.tong_tien || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Tiền cọc (30%)</span>
                        <span>{formatCurrency(formData.tien_coc || 0)}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái đơn</label>
                      <select
                        value={formData.trang_thai_don_hang}
                        onChange={(e) => setFormData({ ...formData, trang_thai_don_hang: e.target.value })}
                        className="input-field"
                      >
                        <option value="Chờ xác nhận">Chờ xác nhận</option>
                        <option value="Đã xác nhận">Đã xác nhận</option>
                        <option value="Đang diễn ra">Đang diễn ra</option>
                        <option value="Đã hoàn thành">Đã hoàn thành</option>
                        <option value="Đã hủy">Đã hủy</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái thanh toán</label>
                      <select
                        value={formData.trang_thai_thanh_toan}
                        onChange={(e) => setFormData({ ...formData, trang_thai_thanh_toan: e.target.value })}
                        className="input-field"
                      >
                        <option value="Chưa thanh toán">Chưa thanh toán</option>
                        <option value="Đã đặt cọc">Đã đặt cọc</option>
                        <option value="Đã thanh toán">Đã thanh toán</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Đang xử lý...' : 'Cập nhật'}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary flex-1">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ⭐ MODAL CHI TIẾT */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng #{selectedBooking.ma_don_hang}</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Khách hàng</p>
                  <p className="font-medium">{selectedBooking.nguoiDung?.ho_ten}</p>
                  <p className="text-sm">{selectedBooking.nguoiDung?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tour</p>
                  <p className="font-medium">{selectedBooking.lichKhoiHanh?.tour?.ten_tour}</p>
                  <p className="text-sm">Ngày KH: {formatDate(selectedBooking.lichKhoiHanh?.ngay_khoi_hanh)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Thông tin khách</p>
                <div className="bg-gray-50 rounded-lg p-3">Người lớn: {selectedBooking.so_luong_nguoi_lon}, Trẻ em: {selectedBooking.so_luong_tre_em}</div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500">Thanh toán</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p>Tổng tiền: <strong>{formatCurrency(selectedBooking.tong_tien)}</strong></p>
                  <p>Tiền cọc: {formatCurrency(selectedBooking.tien_coc || 0)}</p>
                  <p>Trạng thái: {selectedBooking.trang_thai_thanh_toan}</p>
                  <p>NV phụ trách: {selectedBooking.nhanVienPhuTrach?.nguoiDung?.ho_ten || 'Chưa phân công'}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                {selectedBooking.trang_thai_don_hang === 'Chờ xác nhận' && (
                  <button onClick={() => { handleConfirm(selectedBooking.ma_don_hang); setShowDetailModal(false); }} className="btn-primary">Duyệt đơn</button>
                )}
                <button onClick={() => setShowDetailModal(false)} className="btn-secondary">Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ MODAL HỦY ĐƠN */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Hủy đơn hàng #{selectedBooking.ma_don_hang}</h3>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="input-field"
              rows="3"
              placeholder="Nhập lý do hủy..."
            />
            <div className="flex gap-3 mt-4">
              <button onClick={handleCancel} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex-1">Xác nhận hủy</button>
              <button onClick={() => { setShowCancelModal(false); setCancelReason(''); }} className="btn-secondary flex-1">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBookings;