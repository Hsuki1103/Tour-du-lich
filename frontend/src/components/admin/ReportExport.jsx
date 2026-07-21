import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { adminAPI } from '../../api/admin';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { DocumentArrowDownIcon, CalendarIcon } from '@heroicons/react/24/outline';

const ReportExport = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const { data: reportData, isLoading, refetch } = useQuery(
    ['export-report', timeRange, startDate, endDate],
    () => adminAPI.exportReport({
      period: timeRange,
      start_date: startDate || undefined,
      end_date: endDate || undefined
    }),
    { enabled: false }
  );

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

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Xuất báo cáo</h3>

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
            </>
          )}

          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="btn-primary flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            {exportLoading ? 'Đang xuất...' : 'Xuất báo cáo Excel'}
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
          <p className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Báo cáo bao gồm: doanh thu, số lượng đơn hàng, top tour bán chạy, và thống kê hủy tour
          </p>
        </div>
      </div>

      {/* Preview Report Data */}
      {reportData?.data?.data && reportData.data.data.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h4 className="font-semibold text-gray-800">Xem trước dữ liệu</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Mã đơn</th>
                  <th className="px-4 py-2 text-left">Tour</th>
                  <th className="px-4 py-2 text-left">Khách hàng</th>
                  <th className="px-4 py-2 text-left">Ngày đặt</th>
                  <th className="px-4 py-2 text-left">Tổng tiền</th>
                  <th className="px-4 py-2 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reportData.data.data.slice(0, 10).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">#{item['Mã đơn hàng']}</td>
                    <td className="px-4 py-2">{item['Tour']}</td>
                    <td className="px-4 py-2">{item['Khách hàng']}</td>
                    <td className="px-4 py-2">{formatDate(item['Ngày đặt'])}</td>
                    <td className="px-4 py-2 font-medium text-primary-500">
                      {formatCurrency(item['Tổng tiền'])}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`badge badge-${item['Trạng thái'] === 'Đã hủy' ? 'danger' : 'success'}`}>
                        {item['Trạng thái']}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reportData.data.data.length > 10 && (
              <div className="p-3 text-center text-sm text-gray-500">
                Hiển thị 10/{reportData.data.data.length} dòng
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportExport;