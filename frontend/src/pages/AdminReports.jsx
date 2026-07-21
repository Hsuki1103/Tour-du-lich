import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { adminAPI } from '../api/admin';
import AdminLayout from '../components/admin/AdminLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import RevenueChart from '../components/admin/RevenueChart';
import { formatCurrency, formatDate } from '../utils/helpers';
import { DocumentArrowDownIcon, CalendarIcon } from '@heroicons/react/24/outline';

const AdminReports = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const { data: revenueData, isLoading: revenueLoading, refetch } = useQuery(
    ['revenue-stats', timeRange, startDate, endDate],
    () => adminAPI.getRevenueStats({ 
      period: timeRange,
      start_date: startDate || undefined,
      end_date: endDate || undefined
    }),
    { keepPreviousData: true }
  );

  const { data: topToursData, isLoading: topToursLoading } = useQuery(
    ['top-tours-report'],
    () => adminAPI.getTopTours({ limit: 10 })
  );

  const { data: cancellationData, isLoading: cancelLoading } = useQuery(
    ['cancellation-stats-report'],
    () => adminAPI.getCancellationStats()
  );

  const revenueStats = revenueData?.data?.data || {};
  const topTours = topToursData?.data?.data || [];
  const cancellationStats = cancellationData?.data?.data || {};

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await adminAPI.exportReport({
        period: timeRange,
        start_date: startDate || undefined,
        end_date: endDate || undefined
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bao-cao-${timeRange}-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Xuất báo cáo thất bại. Vui lòng thử lại.');
    } finally {
      setExportLoading(false);
    }
  };

  if (revenueLoading || topToursLoading || cancelLoading) {
    return <LoadingSpinner />;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Báo cáo thống kê</h1>
            <p className="text-gray-600">Phân tích dữ liệu và xuất báo cáo</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="btn-primary flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            {exportLoading ? 'Đang xuất...' : 'Xuất báo cáo Excel'}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kỳ báo cáo</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="input-field w-40"
              >
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
                <option value="quarter">Quý này</option>
                <option value="year">Năm nay</option>
                <option value="custom">Tùy chỉnh</option>
              </select>
            </div>
            {timeRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field w-40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field w-40"
                  />
                </div>
                <button
                  onClick={() => refetch()}
                  className="btn-primary"
                >
                  Xem
                </button>
              </>
            )}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Thống kê doanh thu</h2>
          <RevenueChart data={revenueStats} type="line" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-primary-500">
                {formatCurrency(revenueStats.total || 0)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">Số đơn hàng</p>
              <p className="text-2xl font-bold text-blue-500">
                {revenueStats.total_orders || 0}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">Trung bình/đơn</p>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(revenueStats.average_per_order || 0)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">Tăng trưởng</p>
              <p className={`text-2xl font-bold ${(revenueStats.growth || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(revenueStats.growth || 0) >= 0 ? '+' : ''}{revenueStats.growth || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Tours */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Top 10 tour bán chạy</h2>
            {topTours.length > 0 ? (
              <div className="space-y-3">
                {topTours.map((tour, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                        index < 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-800">{tour.ten_tour}</p>
                        <p className="text-sm text-gray-500">{tour.so_luong_dat} đơn đặt</p>
                      </div>
                    </div>
                    <p className="font-semibold text-primary-500">
                      {formatCurrency(tour.doanh_thu)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Chưa có dữ liệu</p>
            )}
          </div>

          {/* Cancellation Statistics */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Thống kê hủy tour</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Tổng đơn hủy</p>
                  <p className="text-2xl font-bold text-red-500">
                    {cancellationStats.total_cancelled || 0}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Tỷ lệ hủy</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {cancellationStats.cancellation_rate || 0}%
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Tổng tiền hoàn lại</p>
                <p className="text-xl font-bold text-green-500">
                  {formatCurrency(cancellationStats.total_refund || 0)}
                </p>
              </div>

              {cancellationStats.top_reasons?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Top lý do hủy:</p>
                  <div className="space-y-1">
                    {cancellationStats.top_reasons.slice(0, 5).map((reason, index) => (
                      <div key={index} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">{reason.ly_do}</span>
                        <span className="font-medium">{reason.so_luong} đơn</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Tổng số tour</p>
            <p className="text-2xl font-bold text-gray-800">{revenueStats.total_tours || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Tổng số khách</p>
            <p className="text-2xl font-bold text-gray-800">{revenueStats.total_customers || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Đánh giá trung bình</p>
            <p className="text-2xl font-bold text-yellow-500">{revenueStats.average_rating || 0} ★</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Tỷ lệ hài lòng</p>
            <p className="text-2xl font-bold text-green-500">{revenueStats.satisfaction_rate || 0}%</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;