import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { reviewsAPI } from '../../api/reviews';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';

const ReviewForm = ({ bookingId, tourId, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});

  const mutation = useMutation(
    (data) => reviewsAPI.createReview(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tour-detail', tourId]);
        queryClient.invalidateQueries(['tour-reviews', tourId]);
        alert('Gửi đánh giá thành công! Cảm ơn bạn đã phản hồi.');
        if (onSuccess) onSuccess();
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Gửi đánh giá thất bại');
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (rating === 0) newErrors.rating = 'Vui lòng chọn số sao';
    if (content.length < 10) newErrors.content = 'Nội dung phải có ít nhất 10 ký tự';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate({
      ma_don_hang: bookingId,
      so_sao: rating,
      noi_dung: content,
      // images would be handled with file upload
    });
  };

  const renderStars = (ratingValue) => {
    const stars = [];
    const displayRating = hoverRating || rating;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          {i <= displayRating ? (
            <StarSolidIcon className="w-8 h-8 text-yellow-400" />
          ) : (
            <StarIcon className="w-8 h-8 text-gray-300" />
          )}
        </button>
      );
    }
    return stars;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Đánh giá của bạn
        </label>
        <div className="flex gap-1">
          {renderStars()}
        </div>
        {errors.rating && (
          <p className="text-red-500 text-sm mt-1">{errors.rating}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          {rating > 0 ? `Bạn đã chọn ${rating} sao` : 'Nhấn vào sao để đánh giá'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nội dung đánh giá *
        </label>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (errors.content) setErrors({ ...errors, content: '' });
          }}
          className={`input-field ${errors.content ? 'border-red-500' : ''}`}
          rows="4"
          placeholder="Chia sẻ trải nghiệm của bạn về tour này..."
        />
        {errors.content && (
          <p className="text-red-500 text-sm mt-1">{errors.content}</p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          {content.length}/10 ký tự tối thiểu
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hình ảnh (không bắt buộc)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setImages(Array.from(e.target.files))}
          className="input-field"
        />
        {images.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            Đã chọn {images.length} ảnh
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={mutation.isLoading}
          className="btn-primary disabled:opacity-50"
        >
          {mutation.isLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Hủy
          </button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;