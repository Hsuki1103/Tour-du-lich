import React from 'react';
import {
  CurrencyDollarIcon,
  TicketIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const DashboardStats = ({ stats }) => {
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
  );
};

export default DashboardStats;