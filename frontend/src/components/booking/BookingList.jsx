import React from 'react';
import { useNavigate } from 'react-router-dom';
import BookingStatus from './BookingStatus';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { EyeIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const BookingList = ({ bookings, loading, onCancel, onDownloadVoucher }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl">
        <p className="text-gray-500 text-lg">Bạn chưa có đơn hàng nào</p>
        <button onClick={() => navigate('/tours')} className="btn-primary mt-4">
          Khám phá tour
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const canCancel = booking.trang_thai_don_hang === 'Chờ xác nhận' || 
                         booking.trang_thai_don_hang === 'Đã xác nhận';
        const canDownloadVoucher = booking.trang_thai_thanh_toan === 'Đã thanh toán' ||
                                  booking.trang_thai_thanh_toan === 'Đã đặt cọc';

        return (
          <div key={booking.ma_don_hang} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Mã đơn hàng</p>
                  <p className="font-semibold">#{booking.ma_don_hang}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tour</p>
                  <p className="font-medium">{booking.lichKhoiHanh?.tour?.ten_tour || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày khởi hành</p>
                  <p>{formatDate(booking.lichKhoiHanh?.ngay_khoi_hanh)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tổng tiền</p>
                  <p className="font-bold text-primary-500">{formatCurrency(booking.tong_tien)}</p>
                </div>
                <div>
                  <BookingStatus 
                    status={booking.trang_thai_don_hang}
                    paymentStatus={booking.trang_thai_thanh_toan}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 bg-gray-50">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(`/my-bookings/${booking.ma_don_hang}`)}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  <EyeIcon className="w-4 h-4" />
                  Chi tiết
                </button>
                
                {canDownloadVoucher && (
                  <button
                    onClick={() => onDownloadVoucher(booking.ma_don_hang)}
                    className="btn-secondary text-sm flex items-center gap-1"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                    Tải vé
                  </button>
                )}
                
                {canCancel && (
                  <button
                    onClick={() => {
                      if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
                        onCancel(booking.ma_don_hang);
                      }
                    }}
                    className="text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors"
                  >
                    Hủy đơn
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
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BookingList;