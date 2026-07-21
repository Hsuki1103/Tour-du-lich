import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { formatCurrency } from '../../utils/helpers';

const RevenueChart = ({ data, type = 'line' }) => {
  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Chưa có dữ liệu doanh thu
      </div>
    );
  }

  const chartData = data.labels.map((label, index) => ({
    name: label,
    doanh_thu: data.revenues?.[index] || 0,
    so_luong: data.counts?.[index] || 0,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium text-gray-800">{label}</p>
          <p className="text-primary-500 font-semibold">
            Doanh thu: {formatCurrency(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="text-blue-500">
              Đơn hàng: {payload[1].value}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" tickFormatter={(value) => `${value / 1000000}M`} />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="doanh_thu" fill="#e74c3c" name="Doanh thu" />
            <Bar yAxisId="right" dataKey="so_luong" fill="#3b82f6" name="Số đơn" />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area type="monotone" dataKey="doanh_thu" stroke="#e74c3c" fill="#fecaca" name="Doanh thu" />
            <Area type="monotone" dataKey="so_luong" stroke="#3b82f6" fill="#bfdbfe" name="Số đơn" />
          </AreaChart>
        );
      default:
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" tickFormatter={(value) => `${value / 1000000}M`} />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="doanh_thu" stroke="#e74c3c" name="Doanh thu" strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="so_luong" stroke="#3b82f6" name="Số đơn" strokeWidth={2} />
          </LineChart>
        );
    }
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;