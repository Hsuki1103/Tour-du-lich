import React from 'react';
import { useNavigate } from 'react-router-dom';
import BookingStatus from './BookingStatus';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const BookingDetail = ({ booking, onCancel, onDownloadVoucher }) => {
  const navigate = useNavigate();

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy đơn hàng</p>
      </div>
    );
  }

  const canCancel = booking.trang_thai_don_hang === 'Chờ xác nhận' || 
                   booking.trang_thai_don_hang === 'Đã xác nhận';
  const canDownloadVoucher = booking.trang_thai_thanh_toan === 'Đã thanh toán' ||
                            booking.trang_thai_thanh_toan === 'Đã đặt cọc';

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/my-bookings')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Quay lại danh sách
      </button>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Đơn hàng #{booking.ma_don_hang}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Ngày đặt: {formatDate(booking.ngay_dat)}
              </p>
            </div>
            <BookingStatus 
              status={booking.trang_thai_don_hang}
              paymentStatus={booking.trang_thai_thanh_toan}
            />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Tour Info */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Thông tin tour</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Tour</p>
                <p className="font-medium">{booking.lichKhoiHanh?.tour?.ten_tour}</p>
              </div>
              <div>
                <p className="text-gray-500">Điểm đến</p>
                <p>{booking.lichKhoiHanh?.tour?.diem_den}</p>
              </div>
              <div>
                <p className="text-gray-500">Ngày khởi hành</p>
                <p>{formatDate(booking.lichKhoiHanh?.ngay_khoi_hanh)}</p>
              </div>
              <div>
                <p className="text-gray-500">Số ngày</p>
                <p>{booking.lichKhoiHanh?.tour?.so_ngay} ngày</p>
              </div>
            </div>
          </div>

          {/* Guest Info */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Thông tin khách</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Người lớn</p>
                <p>{booking.so_luong_nguoi_lon}</p>
              </div>
              <div>
                <p className="text-gray-500">Trẻ em</p>
                <p>{booking.so_luong_tre_em || 0}</p>
              </div>
            </div>
            {booking.thong_tin_khach && booking.thong_tin_khach.length > 0 && (
              <div className="mt-2">
                <p className="text-gray-500 text-sm">Danh sách hành khách:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {booking.thong_tin_khach.map((guest, index) => (
                    <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {guest.ho_ten} ({guest.loai_khach === 'nguoi_lon' ? 'Người lớn' : 'Trẻ em'})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Thông tin thanh toán</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tổng tiền</span>
                <span className="font-bold text-primary-500">{formatCurrency(booking.tong_tien)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tiền cọc (30%)</span>
                <span>{formatCurrency(booking.tien_coc)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tiền còn lại</span>
                <span>{formatCurrency(booking.tien_con_lai)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Trạng thái thanh toán</span>
                <span>{booking.trang_thai_thanh_toan}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {canDownloadVoucher && (
              <button
                onClick={() => onDownloadVoucher(booking.ma_don_hang)}
                className="btn-primary flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Tải vé điện tử
              </button>
            )}
            
            {canCancel && (
              <button
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
                    onCancel(booking.ma_don_hang);
                  }
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Hủy đơn hàng
              </button>
            )}
            
            {booking.trang_thai_don_hang === 'Chờ xác nhận' && 
             booking.trang_thai_thanh_toan === 'Chưa thanh toán' && (
              <button
                onClick={() => navigate(`/payment/${booking.ma_don_hang}`)}
                className="btn-primary"
              >
                Thanh toán ngay
              </button>
            )}
          </div>

          {booking.ly_do_huy && (
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">
                <strong>Lý do hủy:</strong> {booking.ly_do_huy}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;