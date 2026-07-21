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
import { TrashIcon, UserIcon } from '@heroicons/react/24/outline';

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
  const [depositAmount, setDepositAmount] = useState(0);
  const [maxGuests, setMaxGuests] = useState(0);
  
  // ⭐ DÙNG REF ĐỂ TRÁNH INFINITE LOOP
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

  // Lấy giá trị số nguyên
  const adultCount = parseInt(watchAdultCount) || 0;
  const childCount = parseInt(watchChildCount) || 0;
  const totalGuests = adultCount + childCount;

  // ⭐ SỬA LẠI: CẬP NHẬT DANH SÁCH HÀNH KHÁCH - DÙNG REPLACE THAY VÌ APPEND/REMOVE
  useEffect(() => {
    // ⭐ TRÁNH LẶP VÔ HẠN
    if (isUpdatingRef.current) return;
    
    const currentGuests = fields.length;
    
    // ⭐ CHỈ CẬP NHẬT KHI SỐ LƯỢNG THAY ĐỔI
    if (totalGuests !== currentGuests) {
      isUpdatingRef.current = true;
      
      // ⭐ KIỂM TRA SỐ LƯỢNG VƯỢT QUÁ SỐ CHỖ
      if (totalGuests > maxGuests && maxGuests > 0) {
        alert(`Số lượng khách (${totalGuests}) vượt quá số chỗ còn trống (${maxGuests})`);
        // Reset về giá trị hợp lệ
        const newAdult = Math.min(adultCount, maxGuests);
        const newChild = Math.min(childCount, maxGuests - newAdult);
        setValue('so_luong_nguoi_lon', newAdult);
        setValue('so_luong_tre_em', newChild);
        isUpdatingRef.current = false;
        return;
      }

      // ⭐ TẠO DANH SÁCH HÀNH KHÁCH MỚI
      const newGuestList = [];
      
      // Thêm người lớn
      for (let i = 0; i < adultCount; i++) {
        newGuestList.push({
          ho_ten: '',
          ngay_sinh: '',
          gioi_tinh: 'Nam',
          loai_khach: 'nguoi_lon'
        });
      }
      
      // Thêm trẻ em
      for (let i = 0; i < childCount; i++) {
        newGuestList.push({
          ho_ten: '',
          ngay_sinh: '',
          gioi_tinh: 'Nam',
          loai_khach: 'tre_em'
        });
      }

      // ⭐ DÙNG REPLACE ĐỂ THAY THẾ TOÀN BỘ
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
      let total = adultPrice + childPrice;
      
      if (discountInfo) {
        total = discountInfo.gia_sau_giam || total;
      }
      
      setTotalPrice(total);
      setDepositAmount(total * 0.3);
    }
  }, [selectedSchedule, adultCount, childCount, discountInfo]);

  // Validate discount code
  const validateDiscount = async () => {
    if (!watchDiscountCode) {
      setDiscountInfo(null);
      return;
    }

    setDiscountLoading(true);
    try {
      const response = await discountsAPI.validateDiscount({
        code: watchDiscountCode,
        tour_id: parseInt(tourId),
        so_luong_khach: totalGuests
      });
      if (response.data.success) {
        setDiscountInfo(response.data.data);
      }
    } catch (error) {
      setDiscountInfo(null);
      alert(error.response?.data?.message || 'Mã giảm giá không hợp lệ');
    } finally {
      setDiscountLoading(false);
    }
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
        alert(error.response?.data?.message || 'Đặt tour thất bại. Vui lòng thử lại.');
      }
    }
  );

  const onSubmit = (data) => {
    if (!selectedSchedule) {
      alert('Vui lòng chọn ngày khởi hành');
      return;
    }

    const total = (parseInt(data.so_luong_nguoi_lon) || 0) + (parseInt(data.so_luong_tre_em) || 0);
    if (total > maxGuests) {
      alert(`Số lượng khách (${total}) vượt quá số chỗ còn trống (${maxGuests})`);
      return;
    }

    if (total === 0) {
      alert('Vui lòng chọn ít nhất 1 hành khách');
      return;
    }

    const invalidGuests = data.thong_tin_khach.some(
      guest => !guest.ho_ten || !guest.ngay_sinh || !guest.gioi_tinh
    );
    if (invalidGuests) {
      alert('Vui lòng nhập đầy đủ thông tin cho tất cả hành khách');
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
                    // Reset số lượng nếu vượt quá
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
                        alert(`Tổng số khách không được vượt quá ${maxGuests} chỗ`);
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
                        alert(`Tổng số khách không được vượt quá ${maxGuests} chỗ`);
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

            {/* Discount Code */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Mã giảm giá</h2>
              <div className="flex gap-4">
                <input
                  {...register('ma_giam_gia')}
                  className="input-field flex-1"
                  placeholder="Nhập mã giảm giá"
                />
                <button
                  type="button"
                  onClick={validateDiscount}
                  disabled={discountLoading}
                  className="btn-primary px-6 whitespace-nowrap"
                >
                  {discountLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
                </button>
              </div>
              {discountInfo && (
                <div className="mt-2 p-3 bg-green-50 rounded-lg">
                  <p className="text-green-700">
                    ✓ Đã áp dụng mã {discountInfo.ma_code}
                    {discountInfo.loai_giam === 'Phần trăm' 
                      ? ` - Giảm ${discountInfo.muc_giam}%`
                      : ` - Giảm ${formatCurrency(discountInfo.muc_giam)}`
                    }
                  </p>
                  <p className="text-sm text-green-600">
                    Giá sau giảm: {formatCurrency(discountInfo.gia_sau_giam || totalPrice)}
                  </p>
                </div>
              )}
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
              
              {discountInfo && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency((totalPrice / (1 - discountInfo.muc_giam / 100)) - totalPrice || 0)}</span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;