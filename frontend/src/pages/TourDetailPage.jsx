// frontend/src/pages/TourDetailPage.jsx
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { toursAPI } from '../api/tours';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ReviewList from '../components/review/ReviewList';
import { formatCurrency, formatDate, getImageUrl } from '../utils/helpers';
import { 
  CalendarIcon, 
  MapPinIcon, 
  ClockIcon,
  StarIcon as StarSolidIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';

const getRegionColor = (khuVuc) => {
  const colors = {
    'Miền Bắc': 'bg-blue-100 text-blue-700',
    'Miền Trung': 'bg-yellow-100 text-yellow-700',
    'Miền Nam': 'bg-green-100 text-green-700',
  };
  return colors[khuVuc] || 'bg-gray-100 text-gray-700';
};

const getRegionIcon = (khuVuc) => {
  const icons = {
    'Miền Bắc': '🏔️',
    'Miền Trung': '🏖️',
    'Miền Nam': '🌴',
  };
  return icons[khuVuc] || '📍';
};

const TourDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data, isLoading, error } = useQuery(
    ['tour-detail', id],
    () => toursAPI.getTourDetail(id),
  );

  const tour = data?.data?.data;

  const openImageModal = (imageUrl, index = 0) => {
    setSelectedImage(getImageUrl(imageUrl));
    setCurrentImageIndex(index);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Lấy tất cả ảnh (ảnh chính + ảnh phụ)
  const getAllImages = () => {
    const images = [];
    if (tour?.hinh_anh) {
      images.push(getImageUrl(tour.hinh_anh));
    }
    if (tour?.hinh_anh_phu) {
      tour.hinh_anh_phu.forEach(img => {
        images.push(getImageUrl(img));
      });
    }
    return images;
  };

  const allImages = getAllImages();
  const totalImages = allImages.length;

  const nextImage = () => {
    if (currentImageIndex < totalImages - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setSelectedImage(allImages[currentImageIndex + 1]);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      setSelectedImage(allImages[currentImageIndex - 1]);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className="container-custom py-12 text-center">
        <p className="text-red-500">Có lỗi xảy ra khi tải thông tin tour</p>
        <Link to="/tours" className="btn-primary mt-4 inline-block">
          Quay lại danh sách
        </Link>
      </div>
    );
  }
  if (!tour) {
    return (
      <div className="container-custom py-12 text-center">
        <p className="text-gray-500">Không tìm thấy tour</p>
        <Link to="/tours" className="btn-primary mt-4 inline-block">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/tours/${id}` } });
      return;
    }
    if (selectedSchedule) {
      navigate(`/booking/${id}`, { state: { scheduleId: selectedSchedule.ma_lich_khoi_hanh } });
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= roundedRating ? (
          <StarSolidIcon key={i} className="w-5 h-5 text-yellow-400" />
        ) : (
          <StarIcon key={i} className="w-5 h-5 text-gray-300" />
        )
      );
    }
    return stars;
  };

  const schedules = tour.lichKhoiHanhs || [];
  const averageRating = tour.averageRating || 0;
  const totalReviews = tour.totalReviews || 0;
  const regionColor = getRegionColor(tour.khu_vuc);
  const regionIcon = getRegionIcon(tour.khu_vuc);

  const hinhAnhPhu = tour.hinh_anh_phu || [];
  const hasImages = hinhAnhPhu.length > 0;

  return (
    <div className="container-custom py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-500">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link to="/tours" className="hover:text-primary-500">Tour du lịch</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{tour.ten_tour}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* ⭐ GALLERY ẢNH ĐẸP */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
            {/* Ảnh chính lớn */}
            <div className="relative">
              <img
                src={getImageUrl(tour.hinh_anh) || 'https://picsum.photos/seed/tour/800/500'}
                alt={tour.ten_tour}
                className="w-full h-[420px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => openImageModal(tour.hinh_anh, 0)}
                onError={(e) => {
                  e.target.src = 'https://picsum.photos/seed/tour/800/500';
                }}
              />
              
              {/* Badge số lượng ảnh */}
              {totalImages > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-sm">
                  <span>📸</span>
                  <span>1 / {totalImages}</span>
                </div>
              )}
              
              {/* Badge khu vực trên ảnh */}
              {tour.khu_vuc && (
                <div className="absolute top-4 left-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm ${regionColor}`}>
                    <span>{regionIcon}</span>
                    <span>{tour.khu_vuc}</span>
                  </span>
                </div>
              )}
            </div>

            {/* ⭐ Thumbnail ảnh phụ - đẹp hơn */}
            {hasImages && (
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                  {/* Ảnh chính thumbnail */}
                  <div 
                    className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-primary-500 cursor-pointer ring-2 ring-primary-200"
                    onClick={() => openImageModal(tour.hinh_anh, 0)}
                  >
                    <img
                      src={getImageUrl(tour.hinh_anh) || 'https://picsum.photos/seed/tour/100/100'}
                      alt="Ảnh chính"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://picsum.photos/seed/tour/100/100';
                      }}
                    />
                  </div>
                  
                  {/* Ảnh phụ thumbnails */}
                  {hinhAnhPhu.map((img, index) => (
                    <div 
                      key={index}
                      className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-primary-400 transition-all hover:scale-105"
                      onClick={() => openImageModal(img, index + 1)}
                    >
                      <img
                        src={getImageUrl(img)}
                        alt={`Ảnh ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://picsum.photos/seed/tour-sub/100/100';
                        }}
                      />
                      <span className="sr-only">Ảnh {index + 2}</span>
                    </div>
                  ))}
                  
                  {/* Nếu có nhiều ảnh, hiển thị số lượng */}
                  {hinhAnhPhu.length > 8 && (
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 font-medium text-sm">
                      +{hinhAnhPhu.length - 7}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Title & Info */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{tour.ten_tour}</h1>
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-1">
              {renderStars(averageRating)}
              <span className="text-gray-600 ml-2">
                ({totalReviews} đánh giá)
              </span>
            </div>

            <div className="flex items-center text-gray-600">
              <MapPinIcon className="w-5 h-5 mr-1" />
              {tour.diem_den}
            </div>

            <div className="flex items-center text-gray-600">
              <ClockIcon className="w-5 h-5 mr-1" />
              {tour.so_ngay} ngày
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Mô tả tour</h2>
            <p className="text-gray-600 whitespace-pre-line">{tour.mo_ta_chi_tiet}</p>
          </div>

          {/* Itinerary */}
          {tour.lich_trinh && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Lịch trình chi tiết</h2>
              <div className="prose max-w-none">
                <p className="text-gray-600 whitespace-pre-line">{tour.lich_trinh}</p>
              </div>
            </div>
          )}

          {/* Included Services */}
          {tour.dich_vu_bao_gom && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Dịch vụ bao gồm</h2>
              <p className="text-gray-600 whitespace-pre-line">{tour.dich_vu_bao_gom}</p>
            </div>
          )}

          {/* Policy */}
          {tour.chinh_sach_huy && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Chính sách hủy</h2>
              <p className="text-gray-600 whitespace-pre-line">{tour.chinh_sach_huy}</p>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Đánh giá từ khách hàng</h2>
            <ReviewList tourId={parseInt(id)} reviews={tour.danhGias || []} />
          </div>
        </div>

        {/* Right Column - Booking */}
        <div>
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Đặt tour ngay</h3>

            {tour.khu_vuc && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Khu vực</p>
                <p className="font-medium text-gray-800">
                  {regionIcon} {tour.khu_vuc}
                </p>
              </div>
            )}

            {/* Schedule Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chọn ngày khởi hành
              </label>
              {schedules.length > 0 ? (
                <select
                  value={selectedSchedule?.ma_lich_khoi_hanh || ''}
                  onChange={(e) => {
                    const schedule = schedules.find(
                      s => s.ma_lich_khoi_hanh === parseInt(e.target.value)
                    );
                    setSelectedSchedule(schedule);
                  }}
                  className="w-full input-field"
                >
                  <option value="">-- Chọn ngày --</option>
                  {schedules.map((schedule) => (
                    <option key={schedule.ma_lich_khoi_hanh} value={schedule.ma_lich_khoi_hanh}>
                      {formatDate(schedule.ngay_khoi_hanh)} - {schedule.so_chot_con_lai} chỗ
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-red-500">Hiện chưa có lịch khởi hành</p>
              )}
            </div>

            {/* Price Display */}
            {selectedSchedule && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Giá người lớn</span>
                  <span className="font-bold text-primary-600">
                    {formatCurrency(selectedSchedule.gia_nguoi_lon)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-600">Giá trẻ em</span>
                  <span className="font-bold text-primary-600">
                    {formatCurrency(selectedSchedule.gia_tre_em)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                  <span className="text-gray-600">Còn trống</span>
                  <span className={`font-semibold ${
                    selectedSchedule.so_chot_con_lai > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedSchedule.so_chot_con_lai} chỗ
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleBookNow}
              disabled={!selectedSchedule || selectedSchedule.so_chot_con_lai === 0}
              className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                !selectedSchedule || selectedSchedule.so_chot_con_lai === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'btn-primary'
              }`}
            >
              {!isAuthenticated
                ? 'Đăng nhập để đặt tour'
                : !selectedSchedule
                ? 'Chọn ngày khởi hành'
                : selectedSchedule.so_chot_con_lai === 0
                ? 'Hết chỗ'
                : 'Đặt tour ngay'}
            </button>

            {selectedSchedule && selectedSchedule.so_chot_con_lai > 0 && (
              <div className="mt-4 text-center text-sm text-gray-500">
                <CheckCircleIcon className="w-4 h-4 text-green-500 inline mr-1" />
                Đặt cọc 30% - Thanh toán linh hoạt
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ⭐ MODAL XEM ẢNH LỚN - ĐẸP HƠN VỚI ĐIỀU HƯỚNG */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-5xl w-full max-h-[95vh]">
            {/* Nút đóng */}
            <button
              onClick={closeImageModal}
              className="absolute -top-14 right-0 text-white/70 hover:text-white text-3xl transition-colors z-10"
            >
              <XMarkIcon className="w-8 h-8" />
            </button>

            {/* Ảnh */}
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={selectedImage}
                alt="Ảnh tour"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                onError={(e) => {
                  e.target.src = 'https://picsum.photos/seed/tour-modal/800/600';
                }}
              />
            </div>

            {/* ⭐ Nút điều hướng ảnh */}
            {totalImages > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  disabled={currentImageIndex === 0}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all ${
                    currentImageIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'
                  }`}
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>
                
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  disabled={currentImageIndex === totalImages - 1}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all ${
                    currentImageIndex === totalImages - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'
                  }`}
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>

                {/* Chỉ số ảnh */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                  <span>📸</span>
                  <span>{currentImageIndex + 1} / {totalImages}</span>
                </div>
              </>
            )}

            <p className="text-white/50 text-xs text-center mt-4">
              Nhấn vào bất kỳ đâu để đóng | Dùng phím ← → để chuyển ảnh
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourDetailPage;