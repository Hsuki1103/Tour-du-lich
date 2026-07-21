import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { bookingsAPI } from '../../api/bookings';
import LoadingSpinner from '../common/LoadingSpinner';
import Pagination from '../common/Pagination';
import { formatCurrency, formatDate, getStatusColor } from '../../utils/helpers';

const BookingHistory = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery(
    ['booking-history', page],
    () => bookingsAPI.getMyBookings({ page, limit: 10 }),
    { keepPreviousData: true }
  );

  const bookings = data?.data?.data?.items || [];
  const total = data?.data?.data?.total || 0;
  const totalPages = data?.data?.data?.totalPages || 1;

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <p className="text-red-500">Có lỗi xảy ra khi tải lịch sử</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Lịch sử đặt tour</h2>

      {bookings.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Mã đơn</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Tour</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Ngày KH</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Số khách</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Tổng tiền</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.ma_don_hang} className="border-b hover:bg-gray-50">
                    <td className="py-3 text-sm">#{booking.ma_don_hang}</td>
                    <td className="py-3 text-sm">{booking.lichKhoiHanh?.tour?.ten_tour || 'N/A'}</td>
                    <td className="py-3 text-sm">{formatDate(booking.lichKhoiHanh?.ngay_khoi_hanh)}</td>
                    <td className="py-3 text-sm">
                      {booking.so_luong_nguoi_lon + booking.so_luong_tre_em}
                    </td>
                    <td className="py-3 text-sm font-medium text-primary-500">
                      {formatCurrency(booking.tong_tien)}
                    </td>
                    <td className="py-3">
                      <span className={`badge badge-${getStatusColor(booking.trang_thai_don_hang)}`}>
                        {booking.trang_thai_don_hang}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Bạn chưa có lịch sử đặt tour nào</p>
        </div>
      )}
    </div>
  );
};

export default BookingHistory;