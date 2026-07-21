import React from 'react';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';

const ReviewItem = ({ review, showDelete = false, onDelete }) => {
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating ? (
          <StarSolidIcon key={i} className="w-4 h-4 text-yellow-400" />
        ) : (
          <StarIcon key={i} className="w-4 h-4 text-gray-300" />
        )
      );
    }
    return stars;
  };

  return (
    <div className="border-b border-gray-100 pb-4 last:border-0">
      <div className="flex items-start gap-3">
        <img
          src={review.nguoiDung?.anh_dai_dien || 'https://via.placeholder.com/40'}
          alt={review.nguoiDung?.ho_ten}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">
                {review.nguoiDung?.ho_ten || 'Khách hàng'}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {renderStars(review.so_sao)}
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(review.ngay_danh_gia)}
                </span>
              </div>
            </div>
            {showDelete && (
              <button
                onClick={() => onDelete?.(review.ma_danh_gia)}
                className="text-red-500 hover:text-red-600 text-sm"
              >
                Xóa
              </button>
            )}
          </div>
          {review.noi_dung && (
            <p className="text-gray-600 mt-2">{review.noi_dung}</p>
          )}
          {review.hinh_anh && (
            <div className="mt-2 flex gap-2">
              {JSON.parse(review.hinh_anh || '[]').map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Review ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewItem;