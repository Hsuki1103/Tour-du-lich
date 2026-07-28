// frontend/src/pages/DiscountsPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { discountsAPI } from '../api/discounts';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import { formatCurrency, formatDate } from '../utils/helpers';
import { 
  GiftIcon, 
  TagIcon, 
  CalendarIcon, 
  UsersIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  UserIcon,
  GlobeAltIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

const DiscountsPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState('public');

  // Fetch public discounts (chỉ public)
  const { data: publicData, isLoading: publicLoading, error: publicError, refetch: refetchPublic } = useQuery(
    ['public-discounts', page],
    () => discountsAPI.getPublicDiscounts({ page, limit: 12 }),
    {
      keepPreviousData: true,
      refetchOnWindowFocus: true
    }
  );

  // ⭐ Fetch my discounts - GỌI NGAY KHI VÀO TRANG
  const { data: myData, isLoading: myLoading, error: myError, refetch: refetchMy } = useQuery(
    ['my-discounts'],
    () => discountsAPI.getMyDiscounts(),
    {
      refetchOnWindowFocus: true,
      // ⭐ BỎ enabled: false, LUÔN GỌI API
    }
  );

  const publicDiscounts = publicData?.data?.data?.items || [];
  const totalPublic = publicData?.data?.data?.total || 0;
  const totalPublicPages = publicData?.data?.data?.totalPages || 1;

  const myDiscounts = myData?.data?.data || [];
  const totalMy = myData?.data?.total || 0;

  const filteredPublicDiscounts = publicDiscounts.filter(d => 
    d.ma_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.ten_chuong_trinh.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetail = (discount) => {
    setSelectedDiscount(discount);
    setShowDetailModal(true);
  };

  const getStatusBadge = (discount) => {
    const now = new Date();
    const start = new Date(discount.ngay_bat_dau);
    const end = new Date(discount.ngay_ket_thuc);
    const isActive = now >= start && now <= end && discount.so_luong_con_lai > 0;

    if (isActive) {
      return <span className="badge badge-success">Còn hiệu lực</span>;
    } else if (discount.so_luong_con_lai <= 0) {
      return <span className="badge badge-danger">Đã hết lượt</span>;
    } else if (now > end) {
      return <span className="badge badge-warning">Đã hết hạn</span>;
    } else {
      return <span className="badge badge-primary">Sắp diễn ra</span>;
    }
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const isLoading = (activeTab === 'public' && publicLoading) || (activeTab === 'my' && myLoading);
  const error = activeTab === 'public' ? publicError : myError;
  const refetch = activeTab === 'public' ? refetchPublic : refetchMy;

  if (isLoading) return <LoadingSpinner />;

  const currentData = activeTab === 'public' ? filteredPublicDiscounts : myDiscounts;

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <GiftIcon className="w-8 h-8 text-primary-500" />
          <h1 className="text-3xl font-bold text-gray-800">Mã giảm giá</h1>
        </div>
        <p className="text-gray-600">Nhận ưu đãi hấp dẫn cho chuyến đi của bạn</p>
      </div>

      {/* ⭐ Tabs - HIỂN THỊ SỐ LƯỢNG NGAY TỪ ĐẦU */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('public')}
          className={`pb-3 px-4 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'public' 
              ? 'text-primary-500 border-b-2 border-primary-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <GlobeAltIcon className="w-4 h-4" />
          Mã giảm giá
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
            {totalPublic}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`pb-3 px-4 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'my' 
              ? 'text-primary-500 border-b-2 border-primary-500' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LockClosedIcon className="w-4 h-4" />
          Mã của tôi
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
            {totalMy}
          </span>
        </button>
      </div>

      {/* Search - chỉ hiển thị khi tab public */}
      {activeTab === 'public' && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mã giảm giá..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
      )}

      {error ? (
        <div className="text-center py-12">
          <p className="text-red-500">Có lỗi xảy ra khi tải danh sách mã giảm giá</p>
          <button onClick={() => refetch()} className="btn-primary mt-4">Thử lại</button>
        </div>
      ) : currentData.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentData.map((discount) => {
              const daysRemaining = getDaysRemaining(discount.ngay_ket_thuc);
              const isActive = new Date() >= new Date(discount.ngay_bat_dau) && 
                               new Date() <= new Date(discount.ngay_ket_thuc) && 
                               discount.so_luong_con_lai > 0;

              const isMyDiscount = discount.da_su_dung !== undefined;
              const isUsed = isMyDiscount && discount.da_su_dung === 1;
              const isPrivate = discount.loai_ma === 'private';

              return (
                <div 
                  key={discount.ma || discount.ma_giam_gia} 
                  className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer ${
                    isActive && !isUsed 
                      ? 'border-l-4 border-green-500' 
                      : isUsed 
                        ? 'border-l-4 border-gray-300 opacity-60' 
                        : 'border-l-4 border-gray-300'
                  }`}
                  onClick={() => handleViewDetail(discount)}
                >
                  <div className="p-6">
                    {/* Code + Badge */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-5 h-5 text-primary-500" />
                        <span className="font-mono font-bold text-xl text-primary-600">
                          {discount.ma_code}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isUsed ? (
                          <span className="badge badge-gray">Đã sử dụng</span>
                        ) : (
                          getStatusBadge(discount)
                        )}
                        {isPrivate && (
                          <span className="badge badge-primary text-xs flex items-center gap-1">
                            <LockClosedIcon className="w-3 h-3" />
                            Riêng tư
                          </span>
                        )}
                        {!isPrivate && activeTab === 'public' && (
                          <span className="badge badge-info text-xs flex items-center gap-1">
                            <GlobeAltIcon className="w-3 h-3" />
                            Công khai
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-800 text-lg mb-2 line-clamp-2">
                      {discount.ten_chuong_trinh}
                    </h3>

                    {/* Discount info */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-3xl font-bold text-primary-500">
                        {discount.loai_giam === 'Phần trăm' ? discount.muc_giam : formatCurrency(discount.muc_giam)}
                        <span className="text-lg font-medium">
                          {discount.loai_giam === 'Phần trăm' ? '%' : ''}
                        </span>
                      </span>
                      {discount.giam_toi_da && (
                        <span className="text-sm text-gray-500">
                          (Tối đa {formatCurrency(discount.giam_toi_da)})
                        </span>
                      )}
                    </div>

                    {/* Requirements */}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-gray-400" />
                        <span>Tối thiểu {discount.yeu_cau_toi_thieu} khách</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <span>
                          {isActive ? (
                            <>Còn {daysRemaining} ngày</>
                          ) : (
                            <>Đã hết hạn</>
                          )}
                        </span>
                      </div>
                      {isMyDiscount && (
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className={`w-4 h-4 ${isUsed ? 'text-gray-400' : 'text-green-500'}`} />
                          <span className={isUsed ? 'text-gray-400' : 'text-green-600'}>
                            {isUsed ? 'Đã sử dụng' : 'Chưa sử dụng'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Usage */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Đã sử dụng</span>
                        <span className="font-medium text-gray-700">
                          {discount.so_luong_da_dung} / {discount.so_luong}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary-500 rounded-full h-2 transition-all duration-300"
                          style={{ 
                            width: `${Math.min((discount.so_luong_da_dung / discount.so_luong) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Còn {discount.so_luong_con_lai} lượt sử dụng
                      </p>
                    </div>

                    {/* Date range */}
                    <div className="mt-3 text-xs text-gray-400 flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      <span>
                        {formatDate(discount.ngay_bat_dau)} - {formatDate(discount.ngay_ket_thuc)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {activeTab === 'public' && (
            <Pagination currentPage={page} totalPages={totalPublicPages} onPageChange={setPage} />
          )}
          {activeTab === 'my' && myDiscounts.length === 0 && (
            <div className="text-center py-12">
              <LockClosedIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Bạn chưa có mã giảm giá riêng nào</p>
              <p className="text-sm text-gray-400 mt-1">Admin sẽ gửi mã riêng qua email cho bạn</p>
              <button onClick={() => setActiveTab('public')} className="btn-primary mt-4">
                Xem mã công khai
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl">
          <GiftIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Không tìm thấy mã giảm giá nào</p>
          <p className="text-gray-400 text-sm mt-1">Hiện tại chưa có chương trình khuyến mãi nào</p>
          <Link to="/tours" className="btn-primary mt-4 inline-block">
            Khám phá tour
          </Link>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL CHI TIẾT MÃ GIẢM GIÁ */}
      {/* ============================================ */}
      {showDetailModal && selectedDiscount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <TagIcon className="w-6 h-6 text-primary-500" />
                  <h2 className="text-2xl font-bold text-gray-800">Chi tiết mã giảm giá</h2>
                </div>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Code + Badge */}
                <div className="bg-primary-50 rounded-lg p-4 text-center border-2 border-dashed border-primary-300">
                  <p className="text-sm text-gray-500">Mã giảm giá</p>
                  <p className="font-mono text-3xl font-bold text-primary-600">
                    {selectedDiscount.ma_code}
                  </p>
                  <div className="flex justify-center gap-2 mt-2">
                    {selectedDiscount.loai_ma === 'private' ? (
                      <span className="badge badge-primary text-xs flex items-center gap-1">
                        <LockClosedIcon className="w-3 h-3" />
                        Riêng tư
                      </span>
                    ) : (
                      <span className="badge badge-info text-xs flex items-center gap-1">
                        <GlobeAltIcon className="w-3 h-3" />
                        Công khai
                      </span>
                    )}
                    {selectedDiscount.da_su_dung !== undefined && (
                      <span className={`badge ${selectedDiscount.da_su_dung === 1 ? 'badge-gray' : 'badge-success'}`}>
                        {selectedDiscount.da_su_dung === 1 ? 'Đã sử dụng' : 'Chưa sử dụng'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <p className="text-sm text-gray-500">Chương trình</p>
                  <p className="font-semibold text-gray-800 text-lg">
                    {selectedDiscount.ten_chuong_trinh}
                  </p>
                </div>

                {/* Discount amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-500">Mức giảm</p>
                    <p className="text-2xl font-bold text-primary-500">
                      {selectedDiscount.loai_giam === 'Phần trăm' 
                        ? `${selectedDiscount.muc_giam}%` 
                        : formatCurrency(selectedDiscount.muc_giam)
                      }
                    </p>
                  </div>
                  {selectedDiscount.giam_toi_da && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-500">Giảm tối đa</p>
                      <p className="text-xl font-bold text-gray-700">
                        {formatCurrency(selectedDiscount.giam_toi_da)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Requirements */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="font-medium text-gray-700">Điều kiện áp dụng</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Số lượng tối thiểu</p>
                      <p className="font-medium">{selectedDiscount.yeu_cau_toi_thieu} khách</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Còn lại</p>
                      <p className="font-medium text-green-600">
                        {selectedDiscount.so_luong_con_lai} lượt
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ngày bắt đầu</p>
                      <p className="font-medium">{formatDate(selectedDiscount.ngay_bat_dau)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ngày kết thúc</p>
                      <p className="font-medium">{formatDate(selectedDiscount.ngay_ket_thuc)}</p>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button 
                    onClick={() => {
                      setShowDetailModal(false);
                      navigate('/tours');
                    }}
                    className="btn-primary flex-1"
                  >
                    Khám phá tour
                  </button>
                  <button 
                    onClick={() => setShowDetailModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountsPage;