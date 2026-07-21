import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { toursAPI } from '../api/tours';
import TourCard from '../components/tours/TourCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const [featuredTours, setFeaturedTours] = useState([]);

  const { data, isLoading, error, refetch } = useQuery(
    ['featured-tours'],
    () => toursAPI.getTours({ limit: 6, page: 1 }),
    {
      onSuccess: (response) => {
        const tours = response.data.data.items || [];
        setFeaturedTours(tours);
        console.log('✅ Tours loaded:', tours.length);
      },
      onError: (error) => {
        console.error('❌ Error loading tours:', error);
      },
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      staleTime: 0,
      cacheTime: 0
    }
  );

  useEffect(() => {
    refetch();
  }, []);

  const features = [
    {
      icon: MapPinIcon,
      title: 'Đa dạng điểm đến',
      description: 'Hàng trăm điểm đến trên cả nước, từ Bắc vào Nam',
    },
    {
      icon: CalendarIcon,
      title: 'Lịch trình linh hoạt',
      description: 'Nhiều lịch khởi hành để bạn lựa chọn phù hợp',
    },
    {
      icon: UserGroupIcon,
      title: 'Dịch vụ chất lượng',
      description: 'Đội ngũ hướng dẫn viên chuyên nghiệp, nhiệt tình',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Thanh toán an toàn',
      description: 'Tích hợp cổng thanh toán VNPay bảo mật cao',
    },
  ];

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      {/* Hero Section với background ảnh */}
      <div className="relative w-full h-[500px] md:h-[400px] overflow-hidden">
        {/* Ảnh nền */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1920&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        {/* Nội dung */}
        <div className="relative z-10 container-custom mx-auto px-4 h-full flex items-center">
          <div className="max-w-3xl text-white">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Khám phá Việt Nam
              <span className="block text-yellow-400">Cùng Du Lịch Việt</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              Đặt tour du lịch trọn gói dễ dàng, nhanh chóng và an toàn.
              Trải nghiệm những hành trình tuyệt vời cùng chúng tôi.
            </p>
            <Link
              to="/tours"
              className="inline-flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold text-base transition-colors duration-200"
            >
              <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
              Tìm tour ngay
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Tại sao chọn Du Lịch Việt?</h2>
            <p className="text-lg text-gray-600">Chúng tôi cam kết mang đến những trải nghiệm tốt nhất</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Tours Section */}
      <div className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Tour nổi bật</h2>
              <p className="text-lg text-gray-600">Những hành trình được yêu thích nhất</p>
            </div>
            <Link
              to="/tours"
              className="text-primary-500 hover:text-primary-600 font-semibold"
            >
              Xem tất cả →
            </Link>
          </div>

          {error ? (
            <div className="text-center py-12">
              <p className="text-red-500">Có lỗi xảy ra khi tải danh sách tour</p>
              <button 
                onClick={() => refetch()} 
                className="bg-primary-500 text-white px-6 py-2 rounded-lg mt-4"
              >
                Thử lại
              </button>
            </div>
          ) : featuredTours.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTours.map((tour) => (
                <TourCard key={tour.ma_tour} tour={tour} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Chưa có tour nào</p>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section - Nhỏ gọn */}
      <div className="relative py-12 overflow-hidden">
        {/* Ảnh nền CTA */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 to-primary-600/80"></div>
        </div>
        
        {/* Nội dung CTA */}
        <div className="relative z-10 container-custom mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3">
            Sẵn sàng cho chuyến đi của bạn?
          </h2>
          
          <p className="text-base md:text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            Đặt tour ngay hôm nay để nhận ưu đãi hấp dẫn
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/tours"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Khám phá ngay
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-all duration-300 border border-white/30"
            >
              Liên hệ tư vấn
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;