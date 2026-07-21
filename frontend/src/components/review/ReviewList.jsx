import React, { useState } from 'react';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';

const ReviewList = ({ reviews, tourId }) => {
  const [visibleCount, setVisibleCount] = useState(5);

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

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Chưa có đánh giá nào cho tour này</p>
        <p className="text-sm text-gray-400 mt-1">Hãy là người đầu tiên đánh giá!</p>
      </div>
    );
  }

  const sortedReviews = [...reviews].sort((a, b) => 
    new Date(b.ngay_danh_gia) - new Date(a.ngay_danh_gia)
  );

  const visibleReviews = sortedReviews.slice(0, visibleCount);
  const hasMore = visibleCount < sortedReviews.length;

  return (
    <div className="space-y-4">
      {visibleReviews.map((review) => (
        <div key={review.ma_danh_gia} className="border-b border-gray-100 pb-4 last:border-0">
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
      ))}

      {hasMore && (
        <button
          onClick={() => setVisibleCount(prev => prev + 5)}
          className="btn-secondary w-full text-center"
        >
          Xem thêm đánh giá
        </button>
      )}
    </div>
  );
};

export default ReviewList;