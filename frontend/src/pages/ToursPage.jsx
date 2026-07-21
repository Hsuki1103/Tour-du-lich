import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { toursAPI } from '../api/tours';
import TourCard from '../components/tours/TourCard';
import TourFilters from '../components/tours/TourFilters';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ToursPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    diem_den: searchParams.get('diem_den') || '',
    khu_vuc: searchParams.get('khu_vuc') || '',
    tu_ngay: searchParams.get('tu_ngay') || '',
    den_ngay: searchParams.get('den_ngay') || '',
    tu_gia: searchParams.get('tu_gia') || '',
    den_gia: searchParams.get('den_gia') || '',
    so_ngay: searchParams.get('so_ngay') || '',
    page: parseInt(searchParams.get('page')) || 1,
    limit: 12,
  });

  const { data, isLoading, error, refetch } = useQuery(
    ['tours', filters],
    () => toursAPI.getTours(filters),
    {
      keepPreviousData: true,
    }
  );

  const tours = data?.data?.data?.items || [];
  const total = data?.data?.data?.total || 0;
  const totalPages = data?.data?.data?.totalPages || 1;

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
    setSearchParams({ ...filters, ...newFilters, page: 1 });
  };

  const handlePageChange = (page) => {
    setFilters({ ...filters, page });
    setSearchParams({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setFilters({
      diem_den: '',
      khu_vuc: '',
      tu_ngay: '',
      den_ngay: '',
      tu_gia: '',
      den_gia: '',
      so_ngay: '',
      page: 1,
      limit: 12,
    });
    setSearchParams({});
  };

  if (isLoading && !data) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container-custom py-8">
      <div className="mb-8">
        <h1 className="section-title">Tour du lịch</h1>
        <p className="section-subtitle">Khám phá hàng trăm điểm đến hấp dẫn</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-72 flex-shrink-0">
          <TourFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleReset}
          />
        </div>

        {/* Tour List */}
        <div className="flex-1">
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-500">Có lỗi xảy ra khi tải danh sách tour</p>
            </div>
          ) : tours.length > 0 ? (
            <>
              <div className="mb-4 text-gray-600">
                Tìm thấy <strong>{total}</strong> tour
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {tours.map((tour) => (
                  <TourCard key={tour.ma_tour} tour={tour} />
                ))}
              </div>
              <Pagination
                currentPage={filters.page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-gray-500 text-lg">Không tìm thấy tour phù hợp</p>
              <button
                onClick={handleReset}
                className="btn-primary mt-4 inline-block"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToursPage;