import React from 'react';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { CalendarIcon, UsersIcon, CurrencyDollarIcon, MapPinIcon } from '@heroicons/react/24/outline';

const BookingSummary = ({ booking }) => {
  if (!booking) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
        <p>Chưa có thông tin đặt tour</p>
      </div>
    );
  }

  const { 
    ma_don_hang, 
    tong_tien, 
    tien_coc, 
    trang_thai_don_hang, 
    trang_thai_thanh_toan,
    so_luong_nguoi_lon,
    so_luong_tre_em,
    thong_tin_khach,
    ngay_dat,
    lichKhoiHanh,
    maGiamGia
  } = booking;

  const tour = lichKhoiHanh?.tour;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
        <CurrencyDollarIcon className="w-5 h-5 text-primary-500" />
        Tổng quan đơn hàng
      </h3>

      {/* Order Info */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Mã đơn hàng</span>
          <span className="font-medium">#{ma_don_hang}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Ngày đặt</span>
          <span>{formatDate(ngay_dat)}</span>
        </div>
      </div>

      {/* Tour Info */}
      {tour && (
        <div className="border-t pt-3">
          <div className="flex items-start gap-2">
            <img
              src={tour.hinh_anh || '/images/tour-placeholder.jpg'}
              alt={tour.ten_tour}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <p className="font-medium text-gray-800">{tour.ten_tour}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPinIcon className="w-4 h-4" />
                {tour.diem_den}
              </p>
            </div>
          </div>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Ngày khởi hành</span>
              <span>{formatDate(lichKhoiHanh?.ngay_khoi_hanh)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Số ngày</span>
              <span>{tour.so_ngay} ngày</span>
            </div>
          </div>
        </div>
      )}

      {/* Guest Info */}
      <div className="border-t pt-3">
        <div className="flex items-center gap-2 text-sm">
          <UsersIcon className="w-4 h-4 text-gray-400" />
          <span className="font-medium">Khách hàng</span>
        </div>
        <div className="mt-1 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Người lớn</span>
            <span>{so_luong_nguoi_lon}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Trẻ em</span>
            <span>{so_luong_tre_em || 0}</span>
          </div>
          {thong_tin_khach && thong_tin_khach.length > 0 && (
            <div className="mt-2">
              <p className="text-gray-500 text-xs">Danh sách hành khách:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {thong_tin_khach.map((guest, index) => (
                  <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {guest.ho_ten}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Discount */}
      {maGiamGia && (
        <div className="border-t pt-3">
          <div className="flex justify-between text-sm text-green-600">
            <span>Mã giảm giá</span>
            <span className="font-medium">{maGiamGia.ma_code}</span>
          </div>
          <div className="flex justify-between text-sm text-green-600">
            <span>Giảm</span>
            <span>
              {maGiamGia.loai_giam === 'Phần trăm' 
                ? `${maGiamGia.muc_giam}%` 
                : formatCurrency(maGiamGia.muc_giam)}
            </span>
          </div>
        </div>
      )}

      {/* Payment */}
      <div className="border-t pt-3">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Tổng tiền</span>
            <span className="font-bold text-primary-500">{formatCurrency(tong_tien)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tiền cọc (30%)</span>
            <span>{formatCurrency(tien_coc)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tiền còn lại</span>
            <span>{formatCurrency(tong_tien - tien_coc)}</span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="border-t pt-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Trạng thái đơn</span>
          <span className={`badge ${
            trang_thai_don_hang === 'Đã xác nhận' || trang_thai_don_hang === 'Đã hoàn thành'
              ? 'badge-success'
              : trang_thai_don_hang === 'Đã hủy'
              ? 'badge-danger'
              : 'badge-warning'
          }`}>
            {trang_thai_don_hang}
          </span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500">Trạng thái thanh toán</span>
          <span className={`badge ${
            trang_thai_thanh_toan === 'Đã thanh toán'
              ? 'badge-success'
              : trang_thai_thanh_toan === 'Đã đặt cọc'
              ? 'badge-primary'
              : 'badge-warning'
          }`}>
            {trang_thai_thanh_toan}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;