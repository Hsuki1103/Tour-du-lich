import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { adminAPI } from '../api/admin';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AdminLayout from '../components/admin/AdminLayout';
import DashboardStats from '../components/admin/DashboardStats';
import RevenueChart from '../components/admin/RevenueChart';
import { 
  CurrencyDollarIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  TicketIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [timeRange, setTimeRange] = useState('month');

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery(
    ['dashboard-stats'],
    () => adminAPI.getDashboardStats()
  );

  // Fetch revenue data
  const { data: revenueData, isLoading: revenueLoading } = useQuery(
    ['revenue-stats', timeRange],
    () => adminAPI.getRevenueStats({ period: timeRange })
  );

  // Fetch top tours
  const { data: topToursData, isLoading: topToursLoading } = useQuery(
    ['top-tours'],
    () => adminAPI.getTopTours({ limit: 5 })
  );

  // Fetch cancellation stats
  const { data: cancellationData, isLoading: cancelLoading } = useQuery(
    ['cancellation-stats'],
    () => adminAPI.getCancellationStats()
  );

  if (statsLoading || revenueLoading || topToursLoading || cancelLoading) {
    return <LoadingSpinner />;
  }

  const stats = statsData?.data?.data || {};
  const revenueStats = revenueData?.data?.data || {};
  const topTours = topToursData?.data?.data || [];
  const cancellationStats = cancellationData?.data?.data || {};

  const statCards = [
    {
      title: 'Tổng doanh thu',
      value: stats.total_revenue ? `${new Intl.NumberFormat('vi-VN').format(stats.total_revenue)}₫` : '0₫',
      icon: CurrencyDollarIcon,
      color: 'bg-green-100 text-green-600',
      trend: stats.revenue_trend || 0
    },
    {
      title: 'Đơn hàng',
      value: stats.total_bookings || 0,
      icon: TicketIcon,
      color: 'bg-blue-100 text-blue-600',
      trend: stats.booking_trend || 0
    },
    {
      title: 'Khách hàng',
      value: stats.total_users || 0,
      icon: UserGroupIcon,
      color: 'bg-purple-100 text-purple-600',
      trend: stats.user_trend || 0
    },
    {
      title: 'Tour đang bán',
      value: stats.active_tours || 0,
      icon: CalendarIcon,
      color: 'bg-orange-100 text-orange-600',
      trend: stats.tour_trend || 0
    }
  ];

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Bảng điều khiển</h1>
          <p className="text-gray-600">Tổng quan hoạt động của hệ thống</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              {stat.trend !== undefined && (
                <div className="mt-3 flex items-center text-sm">
                  {stat.trend >= 0 ? (
                    <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span className={stat.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {Math.abs(stat.trend)}% so với tháng trước
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Thống kê doanh thu</h2>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input-field w-40"
            >
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="quarter">Quý này</option>
              <option value="year">Năm nay</option>
            </select>
          </div>
          <RevenueChart data={revenueStats} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Tours */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Top tour bán chạy</h2>
            {topTours.length > 0 ? (
              <div className="space-y-4">
                {topTours.map((tour, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-primary-100 text-primary-500 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-800">{tour.ten_tour}</p>
                        <p className="text-sm text-gray-500">{tour.so_luong_dat} đơn đặt</p>
                      </div>
                    </div>
                    <p className="font-semibold text-primary-500">
                      {new Intl.NumberFormat('vi-VN').format(tour.doanh_thu)}₫
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Chưa có dữ liệu</p>
            )}
          </div>

          {/* Cancellation Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Thống kê hủy tour</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Tổng số đơn hủy</span>
                <span className="font-bold text-red-600">{cancellationStats.total_cancelled || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Tỷ lệ hủy</span>
                <span className="font-bold text-orange-600">{cancellationStats.cancellation_rate || 0}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Số tiền hoàn lại</span>
                <span className="font-bold text-green-600">
                  {new Intl.NumberFormat('vi-VN').format(cancellationStats.total_refund || 0)}₫
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Lý do hủy phổ biến:</p>
                {cancellationStats.top_reasons?.length > 0 ? (
                  <div className="space-y-1">
                    {cancellationStats.top_reasons.map((reason, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{reason.ly_do}</span>
                        <span className="font-medium">{reason.so_luong} đơn</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Chưa có dữ liệu</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;