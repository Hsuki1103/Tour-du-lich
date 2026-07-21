import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { toursAPI } from '../api/tours';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ReviewList from '../components/review/ReviewList';
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserIcon, 
  ClockIcon,
  GlobeAltIcon,  // Thêm icon cho khu vực
  StarIcon as StarSolidIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatDate } from '../utils/helpers';

// Hàm lấy màu cho khu vực
const getRegionColor = (khuVuc) => {
  const colors = {
    'Miền Bắc': 'bg-blue-100 text-blue-700',
    'Miền Trung': 'bg-yellow-100 text-yellow-700',
    'Miền Nam': 'bg-green-100 text-green-700',
  };
  return colors[khuVuc] || 'bg-gray-100 text-gray-700';
};

// Hàm lấy icon cho khu vực
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

  const { data, isLoading, error } = useQuery(
    ['tour-detail', id],
    () => toursAPI.getTourDetail(id),
  );

  const tour = data?.data?.data;

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
        {/* Left Column */}
        <div className="lg:col-span-2">
          {/* Image */}
          <div className="rounded-xl overflow-hidden mb-6">
            <img
              src={tour.hinh_anh || '/images/tour-placeholder.jpg'}
              alt={tour.ten_tour}
              className="w-full h-96 object-cover"
              onError={(e) => {
                e.target.src = 'https://picsum.photos/seed/tour/600/400';
              }}
            />
          </div>

          {/* Title & Info */}
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{tour.ten_tour}</h1>
          
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {/* ⭐ Đánh giá */}
            <div className="flex items-center gap-1">
              {renderStars(averageRating)}
              <span className="text-gray-600 ml-2">
                ({totalReviews} đánh giá)
              </span>
            </div>

            {/* 📍 Điểm đến */}
            <div className="flex items-center text-gray-600">
              <MapPinIcon className="w-5 h-5 mr-1" />
              {tour.diem_den}
            </div>

            {/* 🕐 Số ngày */}
            <div className="flex items-center text-gray-600">
              <ClockIcon className="w-5 h-5 mr-1" />
              {tour.so_ngay} ngày
            </div>
          </div>

          {/* 🏷️ HIỂN THỊ TÊN MIỀN / KHU VỰC */}
          {tour.khu_vuc && (
            <div className="mb-6">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${regionColor}`}>
                <span>{regionIcon}</span>
                <span>Khu vực: {tour.khu_vuc}</span>
              </span>
            </div>
          )}

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

            {/* Hiển thị khu vực trong sidebar */}
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
    </div>
  );
};

export default TourDetailPage;