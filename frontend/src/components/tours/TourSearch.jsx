import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, MapPinIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline';

const TourSearch = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState({
    diem_den: '',
    ngay_khoi_hanh: '',
    so_khach: 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchParams.diem_den) params.append('diem_den', searchParams.diem_den);
    if (searchParams.ngay_khoi_hanh) params.append('tu_ngay', searchParams.ngay_khoi_hanh);
    navigate(`/tours?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPinIcon className="w-4 h-4 inline mr-1" />
            Điểm đến
          </label>
          <input
            type="text"
            value={searchParams.diem_den}
            onChange={(e) => setSearchParams({ ...searchParams, diem_den: e.target.value })}
            className="input-field"
            placeholder="Bạn muốn đi đâu?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <CalendarIcon className="w-4 h-4 inline mr-1" />
            Ngày khởi hành
          </label>
          <input
            type="date"
            value={searchParams.ngay_khoi_hanh}
            onChange={(e) => setSearchParams({ ...searchParams, ngay_khoi_hanh: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <UsersIcon className="w-4 h-4 inline mr-1" />
            Số khách
          </label>
          <input
            type="number"
            min="1"
            value={searchParams.so_khach}
            onChange={(e) => setSearchParams({ ...searchParams, so_khach: parseInt(e.target.value) || 1 })}
            className="input-field"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full btn-primary py-2 flex items-center justify-center gap-2"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            Tìm kiếm
          </button>
        </div>
      </form>
    </div>
  );
};

export default TourSearch;