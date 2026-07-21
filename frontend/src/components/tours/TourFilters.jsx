import React from 'react';
import { 
  XMarkIcon, 
  FunnelIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const TourFilters = ({ filters, onFilterChange, onReset }) => {
  const regions = [
    { value: '', label: 'Tất cả khu vực' },
    { value: 'Miền Bắc', label: 'Miền Bắc' },
    { value: 'Miền Trung', label: 'Miền Trung' },
    { value: 'Miền Nam', label: 'Miền Nam' },
  ];

  const dayOptions = [
    { value: '', label: 'Tất cả' },
    { value: '1', label: '1 ngày' },
    { value: '2', label: '2 ngày' },
    { value: '3', label: '3 ngày' },
    { value: '4', label: '4 ngày' },
    { value: '5', label: '5+ ngày' },
  ];

  const priceRanges = [
    { value: '', label: 'Tất cả' },
    { value: '0-1000000', label: 'Dưới 1M' },
    { value: '1000000-3000000', label: '1M - 3M' },
    { value: '3000000-5000000', label: '3M - 5M' },
    { value: '5000000-10000000', label: '5M - 10M' },
    { value: '10000000-', label: 'Trên 10M' },
  ];

  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const handlePriceRangeChange = (value) => {
    if (value) {
      const [min, max] = value.split('-');
      onFilterChange({
        tu_gia: min,
        den_gia: max === '' ? '' : max,
      });
    } else {
      onFilterChange({
        tu_gia: '',
        den_gia: '',
      });
    }
  };

  const isFilterActive = () => {
    return filters.diem_den || filters.khu_vuc || filters.tu_ngay || 
           filters.den_ngay || filters.tu_gia || filters.den_gia || filters.so_ngay;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-800">Bộ lọc</h3>
        </div>
        {isFilterActive() && (
          <button
            onClick={onReset}
            className="text-sm text-primary-500 hover:text-primary-600 font-medium"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Search by destination */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="flex items-center gap-1">
            <MapPinIcon className="w-4 h-4" />
            Điểm đến
          </span>
        </label>
        <input
          type="text"
          value={filters.diem_den || ''}
          onChange={(e) => handleFilterChange('diem_den', e.target.value)}
          className="input-field"
          placeholder="Nhập điểm đến..."
        />
      </div>

      {/* Region filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực</label>
        <select
          value={filters.khu_vuc || ''}
          onChange={(e) => handleFilterChange('khu_vuc', e.target.value)}
          className="input-field"
        >
          {regions.map((region) => (
            <option key={region.value} value={region.value}>
              {region.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date range */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="flex items-center gap-1">
            <CalendarIcon className="w-4 h-4" />
            Ngày khởi hành
          </span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={filters.tu_ngay || ''}
            onChange={(e) => handleFilterChange('tu_ngay', e.target.value)}
            className="input-field"
            placeholder="Từ ngày"
          />
          <input
            type="date"
            value={filters.den_ngay || ''}
            onChange={(e) => handleFilterChange('den_ngay', e.target.value)}
            className="input-field"
            placeholder="Đến ngày"
          />
        </div>
      </div>

      {/* Price range */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="flex items-center gap-1">
            <CurrencyDollarIcon className="w-4 h-4" />
            Khoảng giá
          </span>
        </label>
        <select
          value={
            filters.tu_gia || filters.den_gia
              ? `${filters.tu_gia || 0}-${filters.den_gia || ''}`
              : ''
          }
          onChange={(e) => handlePriceRangeChange(e.target.value)}
          className="input-field"
        >
          {priceRanges.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <input
            type="number"
            value={filters.tu_gia || ''}
            onChange={(e) => handleFilterChange('tu_gia', e.target.value)}
            className="input-field"
            placeholder="Từ"
          />
          <input
            type="number"
            value={filters.den_gia || ''}
            onChange={(e) => handleFilterChange('den_gia', e.target.value)}
            className="input-field"
            placeholder="Đến"
          />
        </div>
      </div>

      {/* Duration */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <span className="flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            Số ngày
          </span>
        </label>
        <select
          value={filters.so_ngay || ''}
          onChange={(e) => handleFilterChange('so_ngay', e.target.value)}
          className="input-field"
        >
          {dayOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Active filters summary */}
      {isFilterActive() && (
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-500 mb-2">Đang áp dụng:</p>
          <div className="flex flex-wrap gap-2">
            {filters.diem_den && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 text-primary-600 text-sm rounded">
                {filters.diem_den}
                <button
                  onClick={() => handleFilterChange('diem_den', '')}
                  className="hover:text-primary-800"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.khu_vuc && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 text-sm rounded">
                {filters.khu_vuc}
                <button
                  onClick={() => handleFilterChange('khu_vuc', '')}
                  className="hover:text-blue-800"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            {(filters.tu_gia || filters.den_gia) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 text-sm rounded">
                {filters.tu_gia || '0'} - {filters.den_gia || '∞'}
                <button
                  onClick={() => {
                    handleFilterChange('tu_gia', '');
                    handleFilterChange('den_gia', '');
                  }}
                  className="hover:text-green-800"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.so_ngay && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 text-sm rounded">
                {filters.so_ngay} ngày
                <button
                  onClick={() => handleFilterChange('so_ngay', '')}
                  className="hover:text-purple-800"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TourFilters;