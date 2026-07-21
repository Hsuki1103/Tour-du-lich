import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { formatCurrency } from '../../utils/helpers';
import { TrashIcon, PlusIcon, UserIcon } from '@heroicons/react/24/outline';

// Validation schema
const bookingSchema = yup.object().shape({
  so_luong_nguoi_lon: yup.number()
    .min(0, 'Số lượng phải >= 0')
    .required('Vui lòng nhập số lượng'),
  so_luong_tre_em: yup.number()
    .min(0, 'Số lượng phải >= 0')
    .default(0),
  yeu_cau_dac_biet: yup.string().nullable(),
  thong_tin_khach: yup.array().of(
    yup.object().shape({
      ho_ten: yup.string().required('Họ tên không được để trống'),
      ngay_sinh: yup.string().required('Ngày sinh không được để trống'),
      gioi_tinh: yup.string().required('Giới tính không được để trống'),
      loai_khach: yup.string().required('Loại khách không được để trống'),
    })
  ),
});

const BookingForm = ({ 
  schedule, 
  onSubmit, 
  isLoading, 
  defaultValues = {},
  children 
}) => {
  const [totalPrice, setTotalPrice] = useState(0);
  const [adultCount, setAdultCount] = useState(defaultValues.so_luong_nguoi_lon || 1);
  const [childCount, setChildCount] = useState(defaultValues.so_luong_tre_em || 0);

  const { register, control, watch, setValue, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(bookingSchema),
    defaultValues: {
      so_luong_nguoi_lon: defaultValues.so_luong_nguoi_lon || 1,
      so_luong_tre_em: defaultValues.so_luong_tre_em || 0,
      yeu_cau_dac_biet: defaultValues.yeu_cau_dac_biet || '',
      thong_tin_khach: defaultValues.thong_tin_khach || [
        { ho_ten: '', ngay_sinh: '', gioi_tinh: 'Nam', loai_khach: 'nguoi_lon' }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'thong_tin_khach'
  });

  const watchAdult = watch('so_luong_nguoi_lon');
  const watchChild = watch('so_luong_tre_em');

  // Calculate total price
  useEffect(() => {
    if (schedule) {
      const adultPrice = parseFloat(schedule.gia_nguoi_lon) * (watchAdult || 0);
      const childPrice = parseFloat(schedule.gia_tre_em) * (watchChild || 0);
      setTotalPrice(adultPrice + childPrice);
    }
  }, [schedule, watchAdult, watchChild]);

  // Update guest list when counts change
  useEffect(() => {
    const totalGuests = (watchAdult || 0) + (watchChild || 0);
    const currentGuests = fields.length;

    if (totalGuests > currentGuests) {
      for (let i = currentGuests; i < totalGuests; i++) {
        append({ 
          ho_ten: '', 
          ngay_sinh: '', 
          gioi_tinh: 'Nam', 
          loai_khach: i < (watchAdult || 0) ? 'nguoi_lon' : 'tre_em' 
        });
      }
    } else if (totalGuests < currentGuests) {
      for (let i = currentGuests - 1; i >= totalGuests; i--) {
        remove(i);
      }
    }
  }, [watchAdult, watchChild, fields.length, append, remove]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Guest Count */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Số lượng khách</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Người lớn (≥ 10 tuổi)
            </label>
            <input
              type="number"
              min="0"
              {...register('so_luong_nguoi_lon', { valueAsNumber: true })}
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
              {...register('so_luong_tre_em', { valueAsNumber: true })}
              className="input-field"
            />
            {errors.so_luong_tre_em && (
              <p className="text-red-500 text-sm mt-1">{errors.so_luong_tre_em.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Guest Information */}
      {(watchAdult > 0 || watchChild > 0) && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700">Thông tin hành khách</h3>
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-700 flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Hành khách {index + 1}
                  <span className="text-sm text-gray-500 ml-2">
                    ({index < (watchAdult || 0) ? 'Người lớn' : 'Trẻ em'})
                  </span>
                </h4>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
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
                value={index < (watchAdult || 0) ? 'nguoi_lon' : 'tre_em'}
              />
            </div>
          ))}
        </div>
      )}

      {/* Special Requests */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Yêu cầu đặc biệt
        </label>
        <textarea
          {...register('yeu_cau_dac_biet')}
          className="input-field"
          rows="3"
          placeholder="Nhập yêu cầu đặc biệt (nếu có)..."
        />
      </div>

      {/* Price Summary */}
      {schedule && (
        <div className="bg-primary-50 rounded-lg p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Người lớn x {watchAdult || 0}</span>
            <span>{formatCurrency((schedule.gia_nguoi_lon || 0) * (watchAdult || 0))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Trẻ em x {watchChild || 0}</span>
            <span>{formatCurrency((schedule.gia_tre_em || 0) * (watchChild || 0))}</span>
          </div>
          <div className="border-t pt-2 mt-2 flex justify-between font-bold">
            <span>Tổng tiền</span>
            <span className="text-primary-500">{formatCurrency(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tiền cọc (30%)</span>
            <span>{formatCurrency(totalPrice * 0.3)}</span>
          </div>
        </div>
      )}

      {/* Children */}
      {children}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Đang xử lý...' : 'Tiếp tục'}
      </button>
    </form>
  );
};

export default BookingForm;