import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { bookingsAPI } from '../api/bookings';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import BookingStatus from '../components/booking/BookingStatus';
import { formatCurrency, formatDate } from '../utils/helpers';
import { 
  EyeIcon, 
  DocumentArrowDownIcon, 
  XMarkIcon,
  PencilIcon,
  CheckIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [isEditing, setIsEditing] = useState(null);
  const [editData, setEditData] = useState({
    so_luong_nguoi_lon: 0,
    so_luong_tre_em: 0,
  });
  const [diffInfo, setDiffInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch bookings
  const { data, isLoading, error, refetch } = useQuery(
    ['my-bookings', page, filter],
    () => bookingsAPI.getMyBookings({ page, limit: 10, trang_thai: filter || undefined }),
    { keepPreviousData: true }
  );

  const bookings = data?.data?.data?.items || [];
  const total = data?.data?.data?.total || 0;
  const totalPages = data?.data?.data?.totalPages || 1;

  // Cancel booking mutation
  const cancelMutation = useMutation(
    ({ id, ly_do }) => bookingsAPI.cancelBooking(id, { ly_do }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['my-bookings']);
        alert('✅ Hủy đơn hàng thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || '❌ Hủy đơn thất bại');
      }
    }
  );

  // Update booking by customer mutation
  const updateMutation = useMutation(
    ({ id, data }) => bookingsAPI.updateBookingByCustomer(id, data),
    {
      onSuccess: (response) => {
        const data = response.data.data;
        setDiffInfo({
          diff_amount: data.diff_amount,
          additional_amount: data.additional_amount,
          refund_amount: data.refund_amount,
          message: data.message,
          days_until_departure: data.days_until_departure
        });
        queryClient.invalidateQueries(['my-bookings']);
        setIsEditing(null);
        setIsSubmitting(false);
        alert(data.message);
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Cập nhật đơn hàng thất bại');
        setIsSubmitting(false);
      }
    }
  );

  // Download voucher
  const downloadMutation = useMutation(
    (id) => bookingsAPI.downloadVoucher(id),
    {
      onSuccess: (response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `voucher_${Date.now()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Tải vé thất bại');
      }
    }
  );

  // Handlers
  const handleCancelBooking = (bookingId) => {
    const ly_do = prompt('Nhập lý do hủy đơn hàng:');
    if (ly_do !== null) {
      cancelMutation.mutate({ id: bookingId, ly_do: ly_do || 'Khách hàng hủy' });
    }
  };

  const handleDownloadVoucher = (bookingId) => {
    downloadMutation.mutate(bookingId);
  };

  const handleStartEdit = (booking) => {
    setIsEditing(booking.ma_don_hang);
    setEditData({
      so_luong_nguoi_lon: booking.so_luong_nguoi_lon || 0,
      so_luong_tre_em: booking.so_luong_tre_em || 0,
    });
    setDiffInfo(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setDiffInfo(null);
  };

  const handleSaveEdit = (bookingId) => {
    const totalGuests = (parseInt(editData.so_luong_nguoi_lon) || 0) + (parseInt(editData.so_luong_tre_em) || 0);
    if (totalGuests === 0) {
      alert('Vui lòng chọn ít nhất 1 khách');
      return;
    }

    setIsSubmitting(true);
    updateMutation.mutate({
      id: bookingId,
      data: {
        so_luong_nguoi_lon: parseInt(editData.so_luong_nguoi_lon) || 0,
        so_luong_tre_em: parseInt(editData.so_luong_tre_em) || 0,
      }
    });
  };

  const handleViewDetail = (bookingId) => {
    navigate(`/my-bookings/${bookingId}`);
  };

  // Calculate days until departure
  const getDaysUntilDeparture = (departureDate) => {
    if (!departureDate) return 0;
    return Math.ceil((new Date(departureDate) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const filters = [
    { value: '', label: 'Tất cả' },
    { value: 'Chờ xác nhận', label: 'Chờ xác nhận' },
    { value: 'Đã xác nhận', label: 'Đã xác nhận' },
    { value: 'Đang diễn ra', label: 'Đang diễn ra' },
    { value: 'Đã hoàn thành', label: 'Đã hoàn thành' },
    { value: 'Đã hủy', label: 'Đã hủy' },
  ];

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Đơn hàng của tôi</h1>
          <p className="text-gray-600 mt-1">Quản lý các tour đã đặt</p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="text-center py-12">
          <p className="text-red-500">Có lỗi xảy ra khi tải danh sách đơn hàng</p>
          <button onClick={() => refetch()} className="btn-primary mt-4">
            Thử lại
          </button>
        </div>
      ) : bookings.length > 0 ? (
        <>
          <div className="space-y-4">
            {bookings.map((booking) => {
              const daysUntilDeparture = getDaysUntilDeparture(booking.lichKhoiHanh?.ngay_khoi_hanh);
              const canCancel = booking.trang_thai_don_hang === 'Chờ xác nhận' || 
                               booking.trang_thai_don_hang === 'Đã xác nhận';
              const canDownloadVoucher = booking.trang_thai_thanh_toan === 'Đã thanh toán' ||
                                        booking.trang_thai_thanh_toan === 'Đã đặt cọc';
              const canEdit = daysUntilDeparture >= 7 && 
                              booking.trang_thai_don_hang !== 'Đã hủy' && 
                              booking.trang_thai_don_hang !== 'Đã hoàn thành' &&
                              booking.trang_thai_don_hang !== 'Đang diễn ra';

              return (
                <div key={booking.ma_don_hang} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Booking Header */}
                  <div className="p-4 md:p-6 border-b">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Mã đơn hàng</p>
                        <p className="font-semibold text-lg">#{booking.ma_don_hang}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tour</p>
                        <p className="font-medium">{booking.lichKhoiHanh?.tour?.ten_tour || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Ngày khởi hành</p>
                        <p className="font-medium">{formatDate(booking.lichKhoiHanh?.ngay_khoi_hanh)}</p>
                        {canEdit && (
                          <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                            <PencilIcon className="w-3 h-3" />
                            Có thể chỉnh sửa
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tổng tiền</p>
                        <p className="font-bold text-primary-500 text-lg">{formatCurrency(booking.tong_tien)}</p>
                      </div>
                      <div>
                        <BookingStatus 
                          status={booking.trang_thai_don_hang}
                          paymentStatus={booking.trang_thai_thanh_toan}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleViewDetail(booking.ma_don_hang)}
                        className="btn-secondary text-sm flex items-center gap-1"
                      >
                        <EyeIcon className="w-4 h-4" />
                        Chi tiết
                      </button>
                      
                      {canDownloadVoucher && (
                        <button
                          onClick={() => handleDownloadVoucher(booking.ma_don_hang)}
                          className="btn-secondary text-sm flex items-center gap-1"
                          disabled={downloadMutation.isLoading}
                        >
                          <DocumentArrowDownIcon className="w-4 h-4" />
                          {downloadMutation.isLoading ? 'Đang tải...' : 'Tải vé'}
                        </button>
                      )}
                      
                      {canCancel && (
                        <button
                          onClick={() => handleCancelBooking(booking.ma_don_hang)}
                          className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors"
                          disabled={cancelMutation.isLoading}
                        >
                          <XMarkIcon className="w-4 h-4" />
                          {cancelMutation.isLoading ? 'Đang xử lý...' : 'Hủy đơn'}
                        </button>
                      )}
                      
                      {booking.trang_thai_don_hang === 'Chờ xác nhận' && 
                       booking.trang_thai_thanh_toan === 'Chưa thanh toán' && (
                        <button
                          onClick={() => navigate(`/payment/${booking.ma_don_hang}`)}
                          className="btn-primary text-sm"
                        >
                          Thanh toán
                        </button>
                      )}
                    </div>

                    {canEdit && (
                      <button
                        onClick={() => handleStartEdit(booking)}
                        className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Chỉnh sửa số lượng
                      </button>
                    )}
                  </div>

                  {/* ⭐ Edit Section */}
                  {isEditing === booking.ma_don_hang && (
                    <div className="p-4 bg-yellow-50 border-t border-yellow-200">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-700">✏️ Chỉnh sửa số lượng khách</h4>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-500 hover:text-gray-700"
                          disabled={isSubmitting}
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3 max-w-sm">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Người lớn</label>
                          <input
                            type="number"
                            min="0"
                            value={editData.so_luong_nguoi_lon}
                            onChange={(e) => setEditData({ 
                              ...editData, 
                              so_luong_nguoi_lon: parseInt(e.target.value) || 0 
                            })}
                            className="input-field"
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Trẻ em</label>
                          <input
                            type="number"
                            min="0"
                            value={editData.so_luong_tre_em}
                            onChange={(e) => setEditData({ 
                              ...editData, 
                              so_luong_tre_em: parseInt(e.target.value) || 0 
                            })}
                            className="input-field"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>

                      {diffInfo && (
                        <div className={`p-3 rounded-lg mb-3 max-w-sm ${
                          diffInfo.diff_amount > 0 ? 'bg-red-50 border border-red-200' : 
                          diffInfo.diff_amount < 0 ? 'bg-green-50 border border-green-200' : 
                          'bg-gray-50 border border-gray-200'
                        }`}>
                          <p className={`font-medium ${
                            diffInfo.diff_amount > 0 ? 'text-red-600' : 
                            diffInfo.diff_amount < 0 ? 'text-green-600' : 
                            'text-gray-600'
                          }`}>
                            {diffInfo.message}
                          </p>
                          {diffInfo.additional_amount > 0 && (
                            <p className="text-sm text-red-500 mt-1">
                              Cần thanh toán thêm: <strong>{formatCurrency(diffInfo.additional_amount)}</strong>
                            </p>
                          )}
                          {diffInfo.refund_amount > 0 && (
                            <p className="text-sm text-green-500 mt-1">
                              Số tiền hoàn lại: <strong>{formatCurrency(diffInfo.refund_amount)}</strong>
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(booking.ma_don_hang)}
                          disabled={isSubmitting}
                          className="btn-primary flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            'Đang xử lý...'
                          ) : (
                            <><CheckIcon className="w-4 h-4" /> Lưu thay đổi</>
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="btn-secondary"
                          disabled={isSubmitting}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentArrowDownIcon className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">Bạn chưa có đơn hàng nào</p>
          <p className="text-gray-400 text-sm mt-1">Hãy đặt tour ngay hôm nay!</p>
          <button onClick={() => navigate('/tours')} className="btn-primary mt-4">
            Khám phá tour
          </button>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;