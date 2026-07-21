import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/helpers';

const TourCard = ({ tour }) => {
  const {
    ma_tour,
    ten_tour,
    diem_den,
    so_ngay,
    hinh_anh,
    lichKhoiHanhs = [],
    averageRating = 0,
    totalReviews = 0
  } = tour;

  const minPrice = lichKhoiHanhs && lichKhoiHanhs.length > 0
    ? Math.min(...lichKhoiHanhs.map(l => parseFloat(l.gia_nguoi_lon)))
    : 0;

  // Hàm render sao
  const renderStars = () => {
    const stars = [];
    const roundedRating = Math.round(averageRating || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= roundedRating ? (
          <StarSolidIcon key={i} className="w-4 h-4 text-yellow-400" />
        ) : (
          <StarIcon key={i} className="w-4 h-4 text-gray-300" />
        )
      );
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <Link to={`/tours/${ma_tour}`}>
        {/* Ảnh */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={hinh_anh || 'https://picsum.photos/seed/tour/600/400'}
            alt={ten_tour}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://picsum.photos/seed/tour/600/400';
            }}
          />
          <div className="absolute top-2 right-2 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {so_ngay} ngày
          </div>
          {(!lichKhoiHanhs || lichKhoiHanhs.length === 0) && (
            <div className="absolute bottom-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
              Hết chỗ
            </div>
          )}
        </div>

        {/* Nội dung */}
        <div className="p-4">
          {/* ⭐ HIỂN THỊ SAO Ở TRANG CHỦ */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-0.5">
              {renderStars()}
              <span className="text-sm text-gray-500 ml-1">
                ({totalReviews || 0})
              </span>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[56px]">
            {ten_tour}
          </h3>

          <div className="flex items-center text-gray-600 text-sm mb-1">
            <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
            <span>{diem_den}</span>
          </div>

          <div className="flex items-center text-gray-600 text-sm mb-3">
            <CalendarIcon className="w-4 h-4 mr-1 flex-shrink-0" />
            <span>{lichKhoiHanhs ? lichKhoiHanhs.length : 0} lịch khởi hành</span>
          </div>

          <div className="flex justify-between items-center pt-3 border-t">
            <div>
              <p className="text-sm text-gray-500">Giá từ</p>
              <p className="text-xl font-bold text-primary-500">
                {formatCurrency(minPrice)}
              </p>
            </div>
            <span className="text-primary-500 hover:text-primary-600 font-semibold">
              Xem chi tiết →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default TourCard;