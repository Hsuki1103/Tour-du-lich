import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { bookingsAPI } from '../../api/bookings';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';
import { 
  EyeIcon, 
  CheckIcon, 
  XMarkIcon, 
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const BookingManagement = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data, isLoading, error, refetch } = useQuery(
    ['admin-bookings', page, filter, searchTerm],
    () => bookingsAPI.getAllBookings({ 
      page, 
      limit: 10, 
      trang_thai: filter || undefined,
      search: searchTerm || undefined
    }),
    { keepPreviousData: true }
  );

  const bookings = data?.data?.data?.items || [];
  const total = data?.data?.data?.total || 0;
  const totalPages = data?.data?.data?.totalPages || 1;

  const confirmMutation = useMutation(
    (id) => bookingsAPI.confirmBooking(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-bookings']);
        alert('Xác nhận đơn hàng thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Xác nhận thất bại');
      }
    }
  );

  const cancelMutation = useMutation(
    ({ id, ly_do }) => bookingsAPI.adminCancelBooking(id, { ly_do }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-bookings']);
        setShowCancelModal(false);
        setCancelReason('');
        alert('Hủy đơn hàng thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Hủy đơn thất bại');
      }
    }
  );

  const filters = [
    { value: '', label: 'Tất cả' },
    { value: 'Chờ xác nhận', label: 'Chờ xác nhận' },
    { value: 'Đã xác nhận', label: 'Đã xác nhận' },
    { value: 'Đang diễn ra', label: 'Đang diễn ra' },
    { value: 'Đã hoàn thành', label: 'Đã hoàn thành' },
    { value: 'Đã hủy', label: 'Đã hủy' },
  ];

  const handleConfirm = (id) => {
    if (window.confirm('Xác nhận đơn hàng này?')) {
      confirmMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy');
      return;
    }
    cancelMutation.mutate({ id: selectedBooking?.ma_don_hang, ly_do: cancelReason });
  };

  const openCancelModal = (booking) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleViewDetail = (booking) => {
    setSelectedBooking(booking);
    setShowDetail(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm đơn hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Bookings Table */}
      {error ? (
        <div className="text-center py-12 text-red-500">
          Có lỗi xảy ra khi tải danh sách đơn hàng
        </div>
      ) : bookings.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetail(booking)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Chi tiết"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        {booking.trang_thai_don_hang === 'Chờ xác nhận' && (
                          <button
                            onClick={() => handleConfirm(booking.ma_don_hang)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Xác nhận"
                          >
                            <CheckIcon className="w-5 h-5" />
                          </button>
                        )}
                        {(booking.trang_thai_don_hang === 'Chờ xác nhận' || 
                          booking.trang_thai_don_hang === 'Đã xác nhận') && (
                          <button
                            onClick={() => openCancelModal(booking)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hủy"
                          >
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
            <p className="text-sm text-gray-500">
              Hiển thị {bookings.length} / {total} đơn hàng
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Trước
              </button>
              <span className="px-3 py-1">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl">
          <p className="text-gray-500">Không có đơn hàng nào</p>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Chi tiết đơn hàng #{selectedBooking.ma_don_hang}
                </h2>
                <button
                  onClick={() => {
                    setShowDetail(false);
                    setSelectedBooking(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Khách hàng</p>
                    <p className="font-medium">{selectedBooking.nguoiDung?.ho_ten}</p>
                    <p className="text-sm text-gray-500">{selectedBooking.nguoiDung?.email}</p>
                    <p className="text-sm text-gray-500">{selectedBooking.nguoiDung?.so_dien_thoai}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tour</p>
                    <p className="font-medium">{selectedBooking.lichKhoiHanh?.tour?.ten_tour}</p>
                    <p className="text-sm text-gray-500">Ngày KH: {formatDate(selectedBooking.lichKhoiHanh?.ngay_khoi_hanh)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Thông tin khách</p>
                  <div className="bg-gray-50 rounded-lg p-3 mt-1">
                    <p>Người lớn: {selectedBooking.so_luong_nguoi_lon}</p>
                    <p>Trẻ em: {selectedBooking.so_luong_tre_em || 0}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Thanh toán</p>
                  <div className="bg-gray-50 rounded-lg p-3 mt-1">
                    <p>Tổng tiền: <strong>{formatCurrency(selectedBooking.tong_tien)}</strong></p>
                    <p>Trạng thái: {selectedBooking.trang_thai_thanh_toan}</p>
                    {selectedBooking.ly_do_huy && (
                      <p className="text-red-500">Lý do hủy: {selectedBooking.ly_do_huy}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  {selectedBooking.trang_thai_don_hang === 'Chờ xác nhận' && (
                    <button
                      onClick={() => {
                        handleConfirm(selectedBooking.ma_don_hang);
                        setShowDetail(false);
                      }}
                      className="btn-primary"
                    >
                      Xác nhận đơn hàng
                    </button>
                  )}
                  {(selectedBooking.trang_thai_don_hang === 'Chờ xác nhận' || 
                    selectedBooking.trang_thai_don_hang === 'Đã xác nhận') && (
                    <button
                      onClick={() => {
                        setShowDetail(false);
                        openCancelModal(selectedBooking);
                      }}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                      Hủy đơn hàng
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowDetail(false);
                      setSelectedBooking(null);
                    }}
                    className="btn-secondary"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Hủy đơn hàng</h3>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedBooking(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                Bạn đang hủy đơn hàng #{selectedBooking.ma_don_hang}. Vui lòng nhập lý do:
              </p>

              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="input-field"
                rows="3"
                placeholder="Nhập lý do hủy..."
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCancel}
                  disabled={cancelMutation.isLoading}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 flex-1 disabled:opacity-50"
                >
                  {cancelMutation.isLoading ? 'Đang xử lý...' : 'Xác nhận hủy'}
                </button>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedBooking(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;