import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { discountsAPI } from '../../api/discounts';

const DiscountForm = ({ discount = null, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    ma_code: '',
    ten_chuong_trinh: '',
    loai_giam: 'Phần trăm',
    muc_giam: '',
    giam_toi_da: '',
    so_luong: '',
    ngay_bat_dau: '',
    ngay_ket_thuc: '',
    yeu_cau_toi_thieu: 1,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (discount) {
      setFormData({
        ma_code: discount.ma_code || '',
        ten_chuong_trinh: discount.ten_chuong_trinh || '',
        loai_giam: discount.loai_giam || 'Phần trăm',
        muc_giam: discount.muc_giam || '',
        giam_toi_da: discount.giam_toi_da || '',
        so_luong: discount.so_luong || '',
        ngay_bat_dau: discount.ngay_bat_dau || '',
        ngay_ket_thuc: discount.ngay_ket_thuc || '',
        yeu_cau_toi_thieu: discount.yeu_cau_toi_thieu || 1,
      });
    }
  }, [discount]);

  const mutation = useMutation(
    (data) => {
      if (discount) {
        return discountsAPI.updateDiscount(discount.ma_giam_gia, data);
      }
      return discountsAPI.createDiscount(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-discounts']);
        onSuccess();
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Lưu mã giảm giá thất bại');
      }
    }
  );

  const validate = () => {
    const newErrors = {};
    if (!formData.ma_code) newErrors.ma_code = 'Mã code không được để trống';
    if (!formData.ten_chuong_trinh) newErrors.ten_chuong_trinh = 'Tên chương trình không được để trống';
    if (!formData.muc_giam) newErrors.muc_giam = 'Mức giảm không được để trống';
    if (formData.muc_giam && (parseFloat(formData.muc_giam) < 0 || parseFloat(formData.muc_giam) > 100)) {
      newErrors.muc_giam = 'Mức giảm phải từ 0 đến 100';
    }
    if (!formData.so_luong) newErrors.so_luong = 'Số lượng không được để trống';
    if (formData.so_luong && parseInt(formData.so_luong) < 1) {
      newErrors.so_luong = 'Số lượng phải lớn hơn 0';
    }
    if (!formData.ngay_bat_dau) newErrors.ngay_bat_dau = 'Ngày bắt đầu không được để trống';
    if (!formData.ngay_ket_thuc) newErrors.ngay_ket_thuc = 'Ngày kết thúc không được để trống';
    if (formData.ngay_bat_dau && formData.ngay_ket_thuc && 
        new Date(formData.ngay_bat_dau) > new Date(formData.ngay_ket_thuc)) {
      newErrors.ngay_ket_thuc = 'Ngày kết thúc phải sau ngày bắt đầu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData = {
      ...formData,
      muc_giam: parseFloat(formData.muc_giam),
      so_luong: parseInt(formData.so_luong),
      yeu_cau_toi_thieu: parseInt(formData.yeu_cau_toi_thieu),
    };

    mutation.mutate(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mã code *</label>
        <input
          type="text"
          value={formData.ma_code}
          onChange={(e) => setFormData({ ...formData, ma_code: e.target.value.toUpperCase() })}
          className={`input-field ${errors.ma_code ? 'border-red-500' : ''}`}
          placeholder="SUMMER2024"
          disabled={!!discount}
        />
        {errors.ma_code && <p className="text-red-500 text-sm mt-1">{errors.ma_code}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tên chương trình *</label>
        <input
          type="text"
          value={formData.ten_chuong_trinh}
          onChange={(e) => setFormData({ ...formData, ten_chuong_trinh: e.target.value })}
          className={`input-field ${errors.ten_chuong_trinh ? 'border-red-500' : ''}`}
          placeholder="Khuyến mãi mùa hè 2024"
        />
        {errors.ten_chuong_trinh && <p className="text-red-500 text-sm mt-1">{errors.ten_chuong_trinh}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm</label>
        <select
          value={formData.loai_giam}
          onChange={(e) => setFormData({ ...formData, loai_giam: e.target.value })}
          className="input-field"
        >
          <option value="Phần trăm">Phần trăm (%)</option>
          <option value="Số tiền">Số tiền (VND)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mức giảm *</label>
        <input
          type="number"
          step={formData.loai_giam === 'Phần trăm' ? '0.1' : '1000'}
          value={formData.muc_giam}
          onChange={(e) => setFormData({ ...formData, muc_giam: e.target.value })}
          className={`input-field ${errors.muc_giam ? 'border-red-500' : ''}`}
          placeholder={formData.loai_giam === 'Phần trăm' ? '10' : '100000'}
        />
        {errors.muc_giam && <p className="text-red-500 text-sm mt-1">{errors.muc_giam}</p>}
        {formData.loai_giam === 'Phần trăm' && (
          <p className="text-xs text-gray-500 mt-1">Nhập số từ 0-100</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa (không bắt buộc)</label>
        <input
          type="number"
          step="1000"
          value={formData.giam_toi_da}
          onChange={(e) => setFormData({ ...formData, giam_toi_da: e.target.value })}
          className="input-field"
          placeholder="500000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng *</label>
        <input
          type="number"
          value={formData.so_luong}
          onChange={(e) => setFormData({ ...formData, so_luong: e.target.value })}
          className={`input-field ${errors.so_luong ? 'border-red-500' : ''}`}
          placeholder="100"
        />
        {errors.so_luong && <p className="text-red-500 text-sm mt-1">{errors.so_luong}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Yêu cầu tối thiểu (số khách)</label>
        <input
          type="number"
          value={formData.yeu_cau_toi_thieu}
          onChange={(e) => setFormData({ ...formData, yeu_cau_toi_thieu: e.target.value })}
          className="input-field"
          min="1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu *</label>
          <input
            type="date"
            value={formData.ngay_bat_dau}
            onChange={(e) => setFormData({ ...formData, ngay_bat_dau: e.target.value })}
            className={`input-field ${errors.ngay_bat_dau ? 'border-red-500' : ''}`}
          />
          {errors.ngay_bat_dau && <p className="text-red-500 text-sm mt-1">{errors.ngay_bat_dau}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc *</label>
          <input
            type="date"
            value={formData.ngay_ket_thuc}
            onChange={(e) => setFormData({ ...formData, ngay_ket_thuc: e.target.value })}
            className={`input-field ${errors.ngay_ket_thuc ? 'border-red-500' : ''}`}
          />
          {errors.ngay_ket_thuc && <p className="text-red-500 text-sm mt-1">{errors.ngay_ket_thuc}</p>}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={mutation.isLoading}
          className="btn-primary flex-1 disabled:opacity-50"
        >
          {mutation.isLoading ? 'Đang lưu...' : discount ? 'Cập nhật' : 'Thêm mã'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Hủy
        </button>
      </div>
    </form>
  );
};

export default DiscountForm;