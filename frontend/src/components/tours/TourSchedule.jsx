import React, { useState } from 'react';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { CalendarIcon, UsersIcon, CurrencyDollarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const TourSchedule = ({ schedules, onSelect, selectedId }) => {
  const [expanded, setExpanded] = useState(false);

  if (!schedules || schedules.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>Hiện chưa có lịch khởi hành</p>
      </div>
    );
  }

  const sortedSchedules = [...schedules].sort((a, b) => 
    new Date(a.ngay_khoi_hanh) - new Date(b.ngay_khoi_hanh)
  );

  const displaySchedules = expanded ? sortedSchedules : sortedSchedules.slice(0, 3);

  return (
    <div className="space-y-3">
      {displaySchedules.map((schedule) => {
        const isSelected = selectedId === schedule.ma_lich_khoi_hanh;
        const isAvailable = schedule.trang_thai === 'Còn chỗ' && schedule.so_chot_con_lai > 0;
        
        return (
          <div
            key={schedule.ma_lich_khoi_hanh}
            onClick={() => isAvailable && onSelect?.(schedule.ma_lich_khoi_hanh)}
            className={`border rounded-lg p-4 transition-all cursor-pointer ${
              isSelected
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : isAvailable
                ? 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                : 'border-gray-200 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {formatDate(schedule.ngay_khoi_hanh).split('/')[0]}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(schedule.ngay_khoi_hanh).split('/').slice(1).join('/')}
                  </div>
                </div>
                <div className="h-12 w-px bg-gray-200" />
                <div>
                  <div className="flex items-center gap-4">
                    <span className={`badge ${
                      isAvailable ? 'badge-success' : 'badge-danger'
                    }`}>
                      {isAvailable ? 'Còn chỗ' : 'Hết chỗ'}
                    </span>
                    <span className="text-sm text-gray-500">
                      <UsersIcon className="w-4 h-4 inline mr-1" />
                      {schedule.so_chot_con_lai || 0} chỗ trống
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-600">
                      <CurrencyDollarIcon className="w-4 h-4 inline mr-1" />
                      Người lớn: {formatCurrency(schedule.gia_nguoi_lon)}
                    </span>
                    <span className="text-sm text-gray-600">
                      Trẻ em: {formatCurrency(schedule.gia_tre_em)}
                    </span>
                  </div>
                </div>
              </div>
              {isSelected && (
                <CheckCircleIcon className="w-6 h-6 text-primary-500" />
              )}
              {!isAvailable && !isSelected && (
                <XCircleIcon className="w-6 h-6 text-gray-400" />
              )}
            </div>
          </div>
        );
      })}

      {schedules.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-primary-500 hover:text-primary-600 font-medium text-sm"
        >
          {expanded ? 'Thu gọn' : `Xem thêm ${schedules.length - 3} lịch khởi hành`}
        </button>
      )}
    </div>
  );
};

export default TourSchedule;