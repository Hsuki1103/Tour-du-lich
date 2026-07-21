import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toursAPI } from '../../api/tours';
import { formatCurrency } from '../../utils/helpers';

const TourForm = ({ tour = null, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    ten_tour: '',
    diem_den: '',
    khu_vuc: '',
    so_ngay: '',
    mo_ta_ngan: '',
    mo_ta_chi_tiet: '',
    lich_trinh: '',
    dich_vu_bao_gom: '',
    chinh_sach_huy: '',
    hinh_anh: null,
  });
  const [schedules, setSchedules] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    ngay_khoi_hanh: '',
    so_chot_toi_da: '',
    gia_nguoi_lon: '',
    gia_tre_em: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (tour) {
      setFormData({
        ten_tour: tour.ten_tour || '',
        diem_den: tour.diem_den || '',
        khu_vuc: tour.khu_vuc || '',
        so_ngay: tour.so_ngay || '',
        mo_ta_ngan: tour.mo_ta_ngan || '',
        mo_ta_chi_tiet: tour.mo_ta_chi_tiet || '',
        lich_trinh: tour.lich_trinh || '',
        dich_vu_bao_gom: tour.dich_vu_bao_gom || '',
        chinh_sach_huy: tour.chinh_sach_huy || '',
        hinh_anh: null,
      });
      setImagePreview(tour.hinh_anh);
      setSchedules(tour.lichKhoiHanhs || []);
    }
  }, [tour]);

  const mutation = useMutation(
    (data) => {
      if (tour) {
        return toursAPI.updateTour(tour.ma_tour, data);
      }
      return toursAPI.createTour(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-tours']);
        queryClient.invalidateQueries(['tour-detail']);
        onSuccess();
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Lưu tour thất bại');
      }
    }
  );

  const scheduleMutation = useMutation(
    (data) => toursAPI.createSchedule(data),
    {
      onSuccess: (response) => {
        setSchedules([...schedules, response.data.data]);
        setScheduleForm({
          ngay_khoi_hanh: '',
          so_chot_toi_da: '',
          gia_nguoi_lon: '',
          gia_tre_em: '',
        });
        alert('Thêm lịch khởi hành thành công!');
      },
      onError: (error) => {
        alert(error.response?.data?.message || 'Thêm lịch khởi hành thất bại');
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, hinh_anh: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScheduleChange = (e) => {
    const { name, value } = e.target;
    setScheduleForm({ ...scheduleForm, [name]: value });
  };

  const handleAddSchedule = (e) => {
    e.preventDefault();
    const { ngay_khoi_hanh, so_chot_toi_da, gia_nguoi_lon, gia_tre_em } = scheduleForm;

    if (!ngay_khoi_hanh || !so_chot_toi_da || !gia_nguoi_lon || !gia_tre_em) {
      alert('Vui lòng nhập đầy đủ thông tin lịch khởi hành');
      return;
    }

    // If tour exists, create schedule directly
    if (tour) {
      scheduleMutation.mutate({
        ma_tour: tour.ma_tour,
        ...scheduleForm
      });
    } else {
      // Add to local state for new tour
      setSchedules([...schedules, { ...scheduleForm, ma_lich_khoi_hanh: Date.now() }]);
      setScheduleForm({
        ngay_khoi_hanh: '',
        so_chot_toi_da: '',
        gia_nguoi_lon: '',
        gia_tre_em: '',
      });
    }
  };

  const handleRemoveSchedule = (index) => {
    if (!tour) {
      setSchedules(schedules.filter((_, i) => i !== index));
    } else {
      // For existing tour, we need to delete from API
      if (window.confirm('Bạn có chắc chắn muốn xóa lịch khởi hành này?')) {
        // API call to delete schedule
        // This would be implemented with a delete API
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.ten_tour) newErrors.ten_tour = 'Tên tour không được để trống';
    if (!formData.diem_den) newErrors.diem_den = 'Điểm đến không được để trống';
    if (!formData.so_ngay) newErrors.so_ngay = 'Số ngày không được để trống';
    if (formData.so_ngay && (parseInt(formData.so_ngay) < 1 || parseInt(formData.so_ngay) > 30)) {
      newErrors.so_ngay = 'Số ngày phải từ 1 đến 30';
    }
    if (!tour && schedules.length === 0) {
      alert('Vui lòng thêm ít nhất một lịch khởi hành');
      return false;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setUploading(true);
    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined) {
        submitData.append(key, formData[key]);
      }
    });

    // Add schedules for new tour
    if (!tour) {
      submitData.append('lich_khoi_hanh', JSON.stringify(schedules));
    }

    mutation.mutate(submitData);
    setUploading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên tour *</label>
          <input
            type="text"
            name="ten_tour"
            value={formData.ten_tour}
            onChange={handleChange}
            className={`input-field ${errors.ten_tour ? 'border-red-500' : ''}`}
            placeholder="Tour Đà Nẵng 3 ngày 2 đêm"
          />
          {errors.ten_tour && <p className="text-red-500 text-sm mt-1">{errors.ten_tour}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đến *</label>
          <input
            type="text"
            name="diem_den"
            value={formData.diem_den}
            onChange={handleChange}
            className={`input-field ${errors.diem_den ? 'border-red-500' : ''}`}
            placeholder="Đà Nẵng, Hội An, Huế"
          />
          {errors.diem_den && <p className="text-red-500 text-sm mt-1">{errors.diem_den}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực</label>
          <select
            name="khu_vuc"
            value={formData.khu_vuc}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Chọn khu vực</option>
            <option value="Miền Bắc">Miền Bắc</option>
            <option value="Miền Trung">Miền Trung</option>
            <option value="Miền Nam">Miền Nam</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số ngày *</label>
          <input
            type="number"
            name="so_ngay"
            value={formData.so_ngay}
            onChange={handleChange}
            className={`input-field ${errors.so_ngay ? 'border-red-500' : ''}`}
            placeholder="3"
            min="1"
            max="30"
          />
          {errors.so_ngay && <p className="text-red-500 text-sm mt-1">{errors.so_ngay}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
          <textarea
            name="mo_ta_ngan"
            value={formData.mo_ta_ngan}
            onChange={handleChange}
            className="input-field"
            rows="2"
            placeholder="Mô tả ngắn gọn về tour..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
          <textarea
            name="mo_ta_chi_tiet"
            value={formData.mo_ta_chi_tiet}
            onChange={handleChange}
            className="input-field"
            rows="4"
            placeholder="Mô tả chi tiết về tour..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Lịch trình</label>
          <textarea
            name="lich_trinh"
            value={formData.lich_trinh}
            onChange={handleChange}
            className="input-field"
            rows="4"
            placeholder="Ngày 1: ...&#10;Ngày 2: ..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Dịch vụ bao gồm</label>
          <textarea
            name="dich_vu_bao_gom"
            value={formData.dich_vu_bao_gom}
            onChange={handleChange}
            className="input-field"
            rows="3"
            placeholder="- Khách sạn&#10;- Ăn uống&#10;- Vé tham quan"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Chính sách hủy</label>
          <textarea
            name="chinh_sach_huy"
            value={formData.chinh_sach_huy}
            onChange={handleChange}
            className="input-field"
            rows="3"
            placeholder="Hủy trước 7 ngày: Hoàn 100%&#10;Hủy trước 3 ngày: Hoàn 50%"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="input-field"
          />
          {imagePreview && (
            <div className="mt-2">
              <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
            </div>
          )}
        </div>
      </div>

      {/* Schedules Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Lịch khởi hành</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            type="date"
            name="ngay_khoi_hanh"
            value={scheduleForm.ngay_khoi_hanh}
            onChange={handleScheduleChange}
            className="input-field"
          />
          <input
            type="number"
            name="so_chot_toi_da"
            value={scheduleForm.so_chot_toi_da}
            onChange={handleScheduleChange}
            className="input-field"
            placeholder="Số chỗ tối đa"
          />
          <input
            type="number"
            name="gia_nguoi_lon"
            value={scheduleForm.gia_nguoi_lon}
            onChange={handleScheduleChange}
            className="input-field"
            placeholder="Giá người lớn"
          />
          <input
            type="number"
            name="gia_tre_em"
            value={scheduleForm.gia_tre_em}
            onChange={handleScheduleChange}
            className="input-field"
            placeholder="Giá trẻ em"
          />
        </div>
        
        <button
          type="button"
          onClick={handleAddSchedule}
          disabled={scheduleMutation.isLoading}
          className="btn-primary"
        >
          {scheduleMutation.isLoading ? 'Đang thêm...' : 'Thêm lịch khởi hành'}
        </button>

        {schedules.length > 0 && (
          <div className="mt-4 space-y-2">
            {schedules.map((schedule, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{schedule.ngay_khoi_hanh}</p>
                  <p className="text-sm text-gray-500">
                    {schedule.so_chot_toi_da} chỗ - {formatCurrency(schedule.gia_nguoi_lon)}/người lớn
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSchedule(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={mutation.isLoading || uploading}
          className="btn-primary disabled:opacity-50"
        >
          {mutation.isLoading || uploading ? 'Đang lưu...' : tour ? 'Cập nhật' : 'Thêm tour'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Hủy
        </button>
      </div>
    </form>
  );
};

export default TourForm;