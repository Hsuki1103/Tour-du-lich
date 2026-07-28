// frontend/src/pages/BookingPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toursAPI } from '../api/tours';
import { bookingsAPI } from '../api/bookings';
import { discountsAPI } from '../api/discounts';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/helpers';
import { toast } from 'react-toastify';
import { 
  TrashIcon, 
  UserIcon, 
  TagIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ChevronDownIcon,
  GiftIcon,
  ClockIcon,
  UsersIcon,
  LockClosedIcon,
  GlobeAltIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Validation schema
const bookingSchema = yup.object().shape({
  so_luong_nguoi_lon: yup.number()
    .min(0, 'Số lượng phải >= 0')
    .required('Vui lòng nhập số lượng'),
  so_luong_tre_em: yup.number()
    .min(0, 'Số lượng phải >= 0')
    .default(0),
  yeu_cau_dac_biet: yup.string().nullable(),
  ma_giam_gia: yup.string().nullable(),
  thong_tin_khach: yup.array().of(
    yup.object().shape({
      ho_ten: yup.string().required('Họ tên không được để trống'),
      ngay_sinh: yup.string().required('Ngày sinh không được để trống'),
      gioi_tinh: yup.string().required('Giới tính không được để trống'),
      loai_khach: yup.string().required('Loại khách không được để trống'),
    })
  ),
});

const BookingPage = () => {
  const { tourId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [maxGuests, setMaxGuests] = useState(0);
  
  // State cho danh sách mã giảm giá
  const [myDiscounts, setMyDiscounts] = useState([]);
  const [publicDiscounts, setPublicDiscounts] = useState([]);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [selectedDiscountCode, setSelectedDiscountCode] = useState('');
  const [discountSearchTerm, setDiscountSearchTerm] = useState('');
  const [activeDiscountTab, setActiveDiscountTab] = useState('all');
  const [isDiscountApplied, setIsDiscountApplied] = useState(false);

  // Ref để tránh infinite loop
  const isUpdatingRef = useRef(false);

  const scheduleId = location.state?.scheduleId;

  // Fetch tour detail
  const { data: tourData, isLoading: tourLoading } = useQuery(
    ['tour-detail', tourId],
    () => toursAPI.getTourDetail(tourId),
    {
      onSuccess: (data) => {
        const schedules = data.data.data.lichKhoiHanhs || [];
        if (scheduleId) {
          const schedule = schedules.find(s => s.ma_lich_khoi_hanh === scheduleId);
          if (schedule) {
            setSelectedSchedule(schedule);
            setMaxGuests(schedule.so_chot_con_lai || 0);
          }
        } else if (schedules.length > 0) {
          setSelectedSchedule(schedules[0]);
          setMaxGuests(schedules[0].so_chot_con_lai || 0);
        }
      }
    }
  );

  const tour = tourData?.data?.data;

  // Fetch danh sách mã giảm giá của khách hàng
  useQuery(
    ['my-discounts-for-booking'],
    () => discountsAPI.getMyDiscounts(),
    {
      enabled: !!user,
      onSuccess: (data) => {
        const discounts = data.data.data || [];
        setMyDiscounts(discounts);
      },
      onError: () => {
        setMyDiscounts([]);
      }
    }
  );

  // Fetch danh sách mã công khai (public)
  useQuery(
    ['public-discounts-for-booking', tourId],
    () => discountsAPI.getPublicDiscounts({ tour_id: tourId, limit: 50 }),
    {
      enabled: !!tourId,
      onSuccess: (data) => {
        const discounts = data.data.data?.items || [];
        setPublicDiscounts(discounts);
      }
    }
  );

  const { register, control, watch, setValue, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(bookingSchema),
    defaultValues: {
      so_luong_nguoi_lon: 1,
      so_luong_tre_em: 0,
      yeu_cau_dac_biet: '',
      ma_giam_gia: '',
      thong_tin_khach: [
        { ho_ten: user?.ho_ten || '', ngay_sinh: '', gioi_tinh: 'Nam', loai_khach: 'nguoi_lon' }
      ]
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'thong_tin_khach'
  });

  const watchAdultCount = watch('so_luong_nguoi_lon');
  const watchChildCount = watch('so_luong_tre_em');
  const watchDiscountCode = watch('ma_giam_gia');

  const adultCount = parseInt(watchAdultCount) || 0;
  const childCount = parseInt(watchChildCount) || 0;
  const totalGuests = adultCount + childCount;

  // Cập nhật danh sách hành khách
  useEffect(() => {
    if (isUpdatingRef.current) return;
    
    const currentGuests = fields.length;
    
    if (totalGuests !== currentGuests) {
      isUpdatingRef.current = true;
      
      if (totalGuests > maxGuests && maxGuests > 0) {
        toast.warning(`Số lượng khách (${totalGuests}) vượt quá số chỗ còn trống (${maxGuests})`);
        const newAdult = Math.min(adultCount, maxGuests);
        const newChild = Math.min(childCount, maxGuests - newAdult);
        setValue('so_luong_nguoi_lon', newAdult);
        setValue('so_luong_tre_em', newChild);
        isUpdatingRef.current = false;
        return;
      }

      const newGuestList = [];
      
      for (let i = 0; i < adultCount; i++) {
        newGuestList.push({
          ho_ten: '',
          ngay_sinh: '',
          gioi_tinh: 'Nam',
          loai_khach: 'nguoi_lon'
        });
      }
      
      for (let i = 0; i < childCount; i++) {
        newGuestList.push({
          ho_ten: '',
          ngay_sinh: '',
          gioi_tinh: 'Nam',
          loai_khach: 'tre_em'
        });
      }

      if (newGuestList.length > 0) {
        replace(newGuestList);
      } else {
        replace([]);
      }
      
      isUpdatingRef.current = false;
    }
  }, [adultCount, childCount, totalGuests, maxGuests, fields.length, replace, setValue]);

  // Tính tổng tiền
  useEffect(() => {
    if (selectedSchedule) {
      const adultPrice = parseFloat(selectedSchedule.gia_nguoi_lon) * adultCount;
      const childPrice = parseFloat(selectedSchedule.gia_tre_em) * childCount;
      const originalTotal = adultPrice + childPrice;
      
      setOriginalPrice(originalTotal);
      
      let finalTotal = originalTotal;
      let discountAmt = 0;
      
      if (discountInfo) {
        const discountPercent = parseFloat(discountInfo.muc_giam) || 0;
        discountAmt = (originalTotal * discountPercent) / 100;
        
        if (discountInfo.giam_toi_da) {
          const maxDiscount = parseFloat(discountInfo.giam_toi_da);
          if (discountAmt > maxDiscount) {
            discountAmt = maxDiscount;
          }
        }
        
        finalTotal = originalTotal - discountAmt;
        setDiscountAmount(discountAmt);
      } else {
        setDiscountAmount(0);
      }
      
      setTotalPrice(finalTotal);
      setDepositAmount(finalTotal * 0.3);
    }
  }, [selectedSchedule, adultCount, childCount, discountInfo]);

  // Lấy danh sách mã gợi ý theo tab
  const getFilteredDiscounts = () => {
    const allDiscounts = [];

    if (activeDiscountTab === 'all' || activeDiscountTab === 'my') {
      myDiscounts.forEach(d => {
        const exists = allDiscounts.some(p => p.ma_code === d.ma_code);
        if (!exists) {
          allDiscounts.push({ ...d, source: 'my' });
        }
      });
    }

    if (activeDiscountTab === 'all' || activeDiscountTab === 'public') {
      publicDiscounts.forEach(d => {
        const exists = allDiscounts.some(p => p.ma_code === d.ma_code);
        if (!exists) {
          allDiscounts.push({ ...d, source: 'public' });
        }
      });
    }

    if (discountSearchTerm.trim()) {
      return allDiscounts.filter(d => 
        d.ma_code.toLowerCase().includes(discountSearchTerm.toLowerCase()) ||
        d.ten_chuong_trinh.toLowerCase().includes(discountSearchTerm.toLowerCase())
      );
    }

    return allDiscounts;
  };

  const filteredDiscounts = getFilteredDiscounts();

  // Hàm áp dụng mã giảm giá
  const applyDiscount = async (code) => {
    if (isDiscountApplied && discountInfo) {
      toast.warning('⚠️ Bạn đã áp dụng mã giảm giá. Vui lòng hủy mã hiện tại trước khi áp dụng mã khác.');
      return;
    }

    if (!code) {
      setDiscountInfo(null);
      setSelectedDiscountCode('');
      setValue('ma_giam_gia', '');
      setIsDiscountApplied(false);
      setDiscountAmount(0);
      return;
    }

    setDiscountLoading(true);
    try {
      const response = await discountsAPI.validateDiscount({
        code: code,
        tour_id: parseInt(tourId),
        so_luong_khach: totalGuests
      });
      
      if (response.data.success) {
        const data = response.data.data;
        
        const percent = parseFloat(data.muc_giam) || 0;
        let discountAmt = (originalPrice * percent) / 100;
        
        if (data.giam_toi_da) {
          const maxDiscount = parseFloat(data.giam_toi_da);
          if (discountAmt > maxDiscount) {
            discountAmt = maxDiscount;
          }
        }
        
        const giaSauGiam = originalPrice - discountAmt;
        
        setDiscountInfo({
          ...data,
          gia_sau_giam: giaSauGiam,
          so_tien_giam: discountAmt
        });
        setSelectedDiscountCode(code);
        setValue('ma_giam_gia', code);
        setIsDiscountApplied(true);
        setDiscountAmount(discountAmt);
        setShowDiscountModal(false);
        toast.success(`✅ Đã áp dụng mã ${code} - Giảm ${formatCurrency(discountAmt)}`);
      }
    } catch (error) {
      setDiscountInfo(null);
      setSelectedDiscountCode('');
      setValue('ma_giam_gia', '');
      setIsDiscountApplied(false);
      setDiscountAmount(0);
      toast.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ');
    } finally {
      setDiscountLoading(false);
    }
  };

  // Hàm hủy mã giảm giá
  const removeDiscount = () => {
    setDiscountInfo(null);
    setSelectedDiscountCode('');
    setValue('ma_giam_gia', '');
    setIsDiscountApplied(false);
    setDiscountAmount(0);
    toast.info('Đã hủy mã giảm giá');
  };

  // Kiểm tra mã có thể áp dụng không
  const canApplyDiscount = (discount) => {
    if (isDiscountApplied && discountInfo) {
      return false;
    }
    if (discount.so_luong_con_lai <= 0) {
      return false;
    }
    return true;
  };

  // Đếm số lượng mã theo tab
  const getCountByTab = (tab) => {
    if (tab === 'my') return myDiscounts.length;
    if (tab === 'public') return publicDiscounts.length;
    return myDiscounts.length + publicDiscounts.length;
  };

  // Create booking mutation
  const bookingMutation = useMutation(
    (data) => bookingsAPI.createBooking(data),
    {
      onSuccess: (response) => {
        const bookingId = response.data.data.ma_don_hang;
        navigate(`/payment/${bookingId}`, {
          state: { 
            totalPrice: totalPrice,
            depositAmount: depositAmount
          }
        });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Đặt tour thất bại. Vui lòng thử lại.');
      }
    }
  );

  const onSubmit = (data) => {
    if (!selectedSchedule) {
      toast.warning('Vui lòng chọn ngày khởi hành');
      return;
    }

    const total = (parseInt(data.so_luong_nguoi_lon) || 0) + (parseInt(data.so_luong_tre_em) || 0);
    if (total > maxGuests) {
      toast.warning(`Số lượng khách (${total}) vượt quá số chỗ còn trống (${maxGuests})`);
      return;
    }

    if (total === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 hành khách');
      return;
    }

    const invalidGuests = data.thong_tin_khach.some(
      guest => !guest.ho_ten || !guest.ngay_sinh || !guest.gioi_tinh
    );
    if (invalidGuests) {
      toast.warning('Vui lòng nhập đầy đủ thông tin cho tất cả hành khách');
      return;
    }

    const bookingData = {
      ma_lich_khoi_hanh: selectedSchedule.ma_lich_khoi_hanh,
      so_luong_nguoi_lon: parseInt(data.so_luong_nguoi_lon) || 0,
      so_luong_tre_em: parseInt(data.so_luong_tre_em) || 0,
      thong_tin_khach: data.thong_tin_khach,
      yeu_cau_dac_biet: data.yeu_cau_dac_biet || '',
      ma_giam_gia: discountInfo?.ma_giam_gia || null
    };

    bookingMutation.mutate(bookingData);
  };

  if (tourLoading) return <LoadingSpinner />;
  if (!tour) {
    return (
      <div className="container-custom py-12 text-center">
        <p className="text-gray-500">Không tìm thấy tour</p>
        <button onClick={() => navigate('/tours')} className="btn-primary mt-4">
          Quay lại
        </button>
      </div>
    );
  }

  const schedules = tour.lichKhoiHanhs || [];

  return (
    <div className="container-custom py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Đặt tour</h1>
        <p className="text-gray-600">{tour.ten_tour}</p>
        {maxGuests > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            ⭐ Số chỗ còn trống: <span className="font-bold text-primary-500">{maxGuests}</span> chỗ
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Schedule Selection */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Ngày khởi hành</h2>
              <select
                value={selectedSchedule?.ma_lich_khoi_hanh || ''}
                onChange={(e) => {
                  const schedule = schedules.find(s => s.ma_lich_khoi_hanh === parseInt(e.target.value));
                  if (schedule) {
                    setSelectedSchedule(schedule);
                    setMaxGuests(schedule.so_chot_con_lai || 0);
                    const currentAdult = parseInt(watchAdultCount) || 0;
                    const currentChild = parseInt(watchChildCount) || 0;
                    if (currentAdult + currentChild > schedule.so_chot_con_lai) {
                      setValue('so_luong_nguoi_lon', Math.min(currentAdult, schedule.so_chot_con_lai));
                      setValue('so_luong_tre_em', 0);
                    }
                  }
                }}
                className="w-full input-field"
              >
                <option value="">-- Chọn ngày --</option>
                {schedules.map((schedule) => (
                  <option key={schedule.ma_lich_khoi_hanh} value={schedule.ma_lich_khoi_hanh}>
                    {formatDate(schedule.ngay_khoi_hanh)} - {schedule.so_chot_con_lai} chỗ trống
                  </option>
                ))}
              </select>
            </div>

            {/* Guest Count */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Số lượng khách</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Người lớn (≥ 10 tuổi)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={adultCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (val + childCount <= maxGuests || maxGuests === 0) {
                        setValue('so_luong_nguoi_lon', val);
                      } else {
                        toast.warning(`Tổng số khách không được vượt quá ${maxGuests} chỗ`);
                      }
                    }}
                    className="input-field"
                  />
                  {errors.so_luong_nguoi_lon && (
                    <p className="text-red-500 text-sm mt-1">{errors.so_luong_nguoi_lon.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trẻ em (2-10 tuổi)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={childCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (adultCount + val <= maxGuests || maxGuests === 0) {
                        setValue('so_luong_tre_em', val);
                      } else {
                        toast.warning(`Tổng số khách không được vượt quá ${maxGuests} chỗ`);
                      }
                    }}
                    className="input-field"
                  />
                  {errors.so_luong_tre_em && (
                    <p className="text-red-500 text-sm mt-1">{errors.so_luong_tre_em.message}</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Tổng: <span className="font-bold">{totalGuests}</span> / {maxGuests} chỗ
                {totalGuests > maxGuests && maxGuests > 0 && (
                  <span className="text-red-500 ml-2">⚠️ Vượt quá số chỗ!</span>
                )}
              </p>
            </div>

            {/* Mã giảm giá */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TagIcon className="w-5 h-5 text-primary-500" />
                Mã giảm giá
                {isDiscountApplied && discountInfo && (
                  <span className="text-sm font-normal text-green-600 flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />
                    Đã áp dụng mã {discountInfo.ma_code}
                  </span>
                )}
              </h2>
              
              {/* Ô nhập mã + nút áp dụng */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <input
                    {...register('ma_giam_gia')}
                    placeholder={isDiscountApplied ? `✓ Đã áp dụng: ${discountInfo?.ma_code}` : 'Nhập mã giảm giá hoặc chọn từ danh sách'}
                    className={`input-field pr-24 ${isDiscountApplied ? 'bg-green-50 border-green-300 text-green-700' : ''}`}
                    readOnly
                    value={watchDiscountCode}
                    onClick={() => {
                      if (!isDiscountApplied) {
                        setShowDiscountModal(true);
                      } else {
                        toast.info('ℹ️ Đã áp dụng mã. Nhấn ✕ để hủy và áp dụng mã khác.');
                      }
                    }}
                  />
                  <button
                    type="button"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-sm py-1 px-3 rounded-lg transition-colors ${
                      isDiscountApplied 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'btn-primary'
                    }`}
                    onClick={() => {
                      if (!isDiscountApplied) {
                        setShowDiscountModal(true);
                      }
                    }}
                    disabled={isDiscountApplied}
                  >
                    <ChevronDownIcon className="w-4 h-4 inline" />
                    Chọn mã
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (isDiscountApplied) {
                      toast.info('ℹ️ Đã áp dụng mã. Nhấn ✕ để hủy và áp dụng mã khác.');
                      return;
                    }
                    applyDiscount(watchDiscountCode);
                  }}
                  disabled={discountLoading || !watchDiscountCode || isDiscountApplied}
                  className={`px-6 whitespace-nowrap disabled:opacity-50 ${
                    isDiscountApplied 
                      ? 'bg-green-100 text-green-700 cursor-not-allowed border border-green-300' 
                      : 'btn-primary'
                  }`}
                >
                  {discountLoading 
                    ? 'Đang kiểm tra...' 
                    : isDiscountApplied 
                    ? '✓ Đã áp dụng' 
                    : 'Áp dụng'}
                </button>
              </div>

              {/* Hiển thị thông tin mã đã áp dụng */}
              {discountInfo && discountAmount > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-primary-600">{discountInfo.ma_code}</span>
                        <span className="badge badge-success">✓ Đã áp dụng</span>
                        {discountInfo.loai_ma === 'private' && (
                          <span className="badge badge-primary text-xs">🔒 Riêng tư</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{discountInfo.ten_chuong_trinh}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm flex-wrap">
                        <span className="text-green-600 font-medium">
                          {discountInfo.loai_giam === 'Phần trăm' 
                            ? `Giảm ${discountInfo.muc_giam}%` 
                            : `Giảm ${formatCurrency(discountInfo.muc_giam)}`
                          }
                        </span>
                        <span className="text-red-500 font-medium">
                          💰 Giảm: {formatCurrency(discountAmount)}
                        </span>
                        <span className="text-gray-500 line-through">
                          {formatCurrency(originalPrice)}
                        </span>
                        <span className="font-medium text-primary-600">
                          → {formatCurrency(totalPrice)}
                        </span>
                      </div>
                      {discountInfo.giam_toi_da && (
                        <p className="text-xs text-gray-400 mt-1">
                          💡 Giảm tối đa: {formatCurrency(discountInfo.giam_toi_da)}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        ⚠️ Mỗi mã chỉ được sử dụng một lần. Không thể áp dụng mã khác sau khi đã áp dụng.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeDiscount}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hủy mã giảm giá"
                    >
                      <XCircleIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}

              {/* Thông báo khi chưa có mã */}
              {!discountInfo && !isDiscountApplied && (
                <p className="text-xs text-gray-400 mt-2">
                  💡 Nhấn vào ô hoặc nút "Chọn mã" để xem danh sách mã giảm giá khả dụng.
                  Mỗi mã chỉ được sử dụng một lần.
                </p>
              )}
            </div>

            {/* Guest Information */}
            {totalGuests > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Thông tin hành khách</h2>
                  <span className="text-sm text-gray-500">
                    {totalGuests} hành khách ({adultCount} người lớn, {childCount} trẻ em)
                  </span>
                </div>
                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const isAdult = index < adultCount;
                    return (
                      <div key={field.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-gray-700 flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            Hành khách {index + 1}
                            <span className="text-sm text-gray-500 ml-2">
                              ({isAdult ? 'Người lớn' : 'Trẻ em'})
                            </span>
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                            <input
                              {...register(`thong_tin_khach.${index}.ho_ten`)}
                              className={`input-field ${errors.thong_tin_khach?.[index]?.ho_ten ? 'border-red-500' : ''}`}
                              placeholder="Nguyễn Văn A"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh *</label>
                            <input
                              type="date"
                              {...register(`thong_tin_khach.${index}.ngay_sinh`)}
                              className={`input-field ${errors.thong_tin_khach?.[index]?.ngay_sinh ? 'border-red-500' : ''}`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính *</label>
                            <select
                              {...register(`thong_tin_khach.${index}.gioi_tinh`)}
                              className={`input-field ${errors.thong_tin_khach?.[index]?.gioi_tinh ? 'border-red-500' : ''}`}
                            >
                              <option value="Nam">Nam</option>
                              <option value="Nữ">Nữ</option>
                              <option value="Khác">Khác</option>
                            </select>
                          </div>
                        </div>
                        <input
                          type="hidden"
                          {...register(`thong_tin_khach.${index}.loai_khach`)}
                          value={isAdult ? 'nguoi_lon' : 'tre_em'}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Special Requests */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Yêu cầu đặc biệt</h2>
              <textarea
                {...register('yeu_cau_dac_biet')}
                className="input-field"
                rows="3"
                placeholder="Nhập yêu cầu đặc biệt (nếu có)..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={bookingMutation.isLoading || !selectedSchedule || totalGuests > maxGuests || totalGuests === 0}
              className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bookingMutation.isLoading 
                ? 'Đang xử lý...' 
                : !selectedSchedule 
                ? 'Chọn ngày khởi hành' 
                : totalGuests === 0 
                ? 'Vui lòng chọn số lượng khách' 
                : totalGuests > maxGuests 
                ? 'Vượt quá số chỗ' 
                : 'Tiếp tục thanh toán'}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Tổng quan đơn hàng</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Tour</span>
                <span className="font-medium">{tour.ten_tour}</span>
              </div>
              
              {selectedSchedule && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày khởi hành</span>
                  <span>{formatDate(selectedSchedule.ngay_khoi_hanh)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Người lớn</span>
                <span>{adultCount}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Trẻ em</span>
                <span>{childCount}</span>
              </div>
              
              {selectedSchedule && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Đơn giá người lớn</span>
                    <span>{formatCurrency(selectedSchedule.gia_nguoi_lon)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Đơn giá trẻ em</span>
                    <span>{formatCurrency(selectedSchedule.gia_tre_em)}</span>
                  </div>
                </>
              )}
              
              {/* Tạm tính */}
              <div className="flex justify-between text-sm text-gray-500 border-t pt-2">
                <span>Tạm tính</span>
                <span>{formatCurrency(originalPrice)}</span>
              </div>
              
              {/* Giảm giá */}
              <div className={`flex justify-between text-sm ${discountAmount > 0 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                <span>
                  Giảm giá {discountInfo && `(${discountInfo.ma_code})`}
                  {discountInfo && discountInfo.loai_giam === 'Phần trăm' && ` -${discountInfo.muc_giam}%`}
                </span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
              
              {/* Thông tin chi tiết mã */}
              {discountInfo && discountAmount > 0 && (
                <div className="bg-green-50 rounded-lg p-2 text-xs text-green-700">
                  <div className="flex justify-between">
                    <span>📌 Mã: <strong>{discountInfo.ma_code}</strong></span>
                    <span>{discountInfo.loai_giam === 'Phần trăm' ? `${discountInfo.muc_giam}%` : formatCurrency(discountInfo.muc_giam)}</span>
                  </div>
                  {discountInfo.giam_toi_da && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm tối đa</span>
                      <span>{formatCurrency(discountInfo.giam_toi_da)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>💰 Đã giảm</span>
                    <span>{formatCurrency(discountAmount)}</span>
                  </div>
                </div>
              )}
              
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng tiền</span>
                  <span className="text-primary-500">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>Tiền cọc (30%)</span>
                  <span>{formatCurrency(depositAmount)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <p>✓ Đặt cọc 30% để giữ chỗ</p>
              <p>✓ Thanh toán phần còn lại sau</p>
              {discountInfo && (
                <p className="mt-1 text-green-600">✓ Đã áp dụng mã {discountInfo.ma_code}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* MODAL CHỌN MÃ GIẢM GIÁ */}
      {/* ============================================ */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <GiftIcon className="w-6 h-6 text-primary-500" />
                  Chọn mã giảm giá
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Chọn mã giảm giá để áp dụng cho đơn hàng của bạn
                </p>
              </div>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-4 border-b flex gap-4">
              {[
                { id: 'all', label: 'Tất cả', icon: null },
                { id: 'my', label: 'Mã của tôi', icon: LockClosedIcon },
                { id: 'public', label: 'Công khai', icon: GlobeAltIcon },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDiscountTab(tab.id)}
                  className={`pb-3 px-2 font-medium transition-colors flex items-center gap-2 relative ${
                    activeDiscountTab === tab.id
                      ? 'text-primary-500 border-b-2 border-primary-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon && <tab.icon className="w-4 h-4" />}
                  {tab.label}
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                    {getCountByTab(tab.id)}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="px-6 py-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm mã giảm giá..."
                  value={discountSearchTerm}
                  onChange={(e) => setDiscountSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {filteredDiscounts.length > 0 ? (
                <div className="space-y-2">
                  {filteredDiscounts.map((discount) => {
                    const isActive = discount.so_luong_con_lai > 0;
                    const isSelected = selectedDiscountCode === discount.ma_code;
                    const isPrivate = discount.loai_ma === 'private' || discount.source === 'my';
                    const canApply = canApplyDiscount(discount);

                    return (
                      <button
                        key={discount.ma || discount.ma_giam_gia}
                        type="button"
                        onClick={() => {
                          if (canApply && isActive) {
                            applyDiscount(discount.ma_code);
                          } else if (!canApply && isDiscountApplied) {
                            toast.warning('⚠️ Bạn đã áp dụng một mã khác. Vui lòng hủy mã hiện tại trước.');
                          } else if (!isActive) {
                            toast.warning('Mã này đã hết lượt sử dụng');
                          }
                        }}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                            : canApply && isActive
                            ? 'border-gray-200 hover:border-primary-300 hover:bg-gray-50 cursor-pointer'
                            : 'border-gray-200 opacity-60 cursor-not-allowed'
                        }`}
                        disabled={!canApply || !isActive}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-lg text-primary-600">
                                {discount.ma_code}
                              </span>
                              {isPrivate ? (
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
                              {isSelected && (
                                <span className="badge badge-success text-xs flex items-center gap-1">
                                  <CheckCircleIcon className="w-3 h-3" />
                                  Đang áp dụng
                                </span>
                              )}
                              {!isActive && (
                                <span className="badge badge-danger text-xs">Hết lượt</span>
                              )}
                              {isDiscountApplied && !isSelected && discountInfo && (
                                <span className="badge badge-gray text-xs">Đã áp dụng mã khác</span>
                              )}
                              {isActive && !isSelected && !isDiscountApplied && (
                                <span className="badge badge-success text-xs">Có thể áp dụng</span>
                              )}
                            </div>
                            <p className="text-gray-700 font-medium mt-1">{discount.ten_chuong_trinh}</p>
                            <div className="flex flex-wrap items-center gap-4 mt-1 text-sm">
                              <span className="text-primary-500 font-semibold">
                                {discount.loai_giam === 'Phần trăm'
                                  ? `Giảm ${discount.muc_giam}%`
                                  : `Giảm ${formatCurrency(discount.muc_giam)}`
                                }
                                {discount.giam_toi_da && ` (tối đa ${formatCurrency(discount.giam_toi_da)})`}
                              </span>
                              <span className="text-gray-500 flex items-center gap-1">
                                <UsersIcon className="w-4 h-4" />
                                Tối thiểu {discount.yeu_cau_toi_thieu} khách
                              </span>
                              <span className="text-gray-500 flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                Còn {discount.so_luong_con_lai} lượt
                              </span>
                              <span className="text-gray-400 text-xs">
                                Hết hạn: {formatDate(discount.ngay_ket_thuc)}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircleIcon className="w-6 h-6 text-primary-500 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <GiftIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Không tìm thấy mã giảm giá</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {discountSearchTerm
                      ? 'Không có mã nào phù hợp với từ khóa tìm kiếm'
                      : 'Hiện tại chưa có mã giảm giá nào khả dụng'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {filteredDiscounts.length} mã giảm giá khả dụng
              </p>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="btn-secondary"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingPage;