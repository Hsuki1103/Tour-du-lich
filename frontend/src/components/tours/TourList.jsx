import React from 'react';
import TourCard from './TourCard';
import LoadingSpinner from '../common/LoadingSpinner';

const TourList = ({ tours, loading, error, onRetry }) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Có lỗi xảy ra khi tải danh sách tour</p>
        <button onClick={onRetry} className="btn-primary mt-4">
          Thử lại
        </button>
      </div>
    );
  }

  if (!tours || tours.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy tour nào</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {tours.map((tour) => (
        <TourCard key={tour.ma_tour} tour={tour} />
      ))}
    </div>
  );
};

export default TourList;